import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User';
import { CoachProfile } from '../models/CoachProfile';
import { RoleChangeAudit, accountRoles } from '../models/RoleChangeAudit';

const provisioningSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'A MongoDB user ID is required'),
  role: z.enum(accountRoles),
  expectedRole: z.enum(accountRoles),
  operator: z.string().trim().min(3).max(120).regex(/^[^\r\n\x00-\x1f]+$/),
  reason: z.string().trim().min(10).max(500).regex(/^[^\r\n\x00-\x1f]+$/),
  apply: z.boolean().default(false),
}).refine((value) => value.role !== value.expectedRole, 'New role must differ from the expected role');

export type RoleProvisioningOptions = z.infer<typeof provisioningSchema>;

export const parseRoleProvisioningArgs = (args: string[]): RoleProvisioningOptions => {
  const values: Record<string, unknown> = {};
  const flags: Record<string, string> = {
    '--user-id': 'userId', '--role': 'role', '--expected-role': 'expectedRole',
    '--operator': 'operator', '--reason': 'reason', '--apply': 'apply',
  };
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    const key = Object.hasOwn(flags, flag) ? flags[flag] : undefined;
    if (!key || key in values) throw new Error(`Unknown or duplicate option: ${flag}`);
    if (flag === '--apply') {
      values.apply = true;
    } else {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      values[key] = value;
    }
  }
  return provisioningSchema.parse(values);
};

/**
 * Only usable by a trusted operator with database credentials. Dry-run is the
 * default. Apply writes role, audit and coach provisioning in one transaction.
 */
export const provisionRole = async (input: RoleProvisioningOptions) => {
  const options = provisioningSchema.parse(input);
  const user = await User.findOne({ _id: options.userId, role: options.expectedRole, isActive: true });
  if (!user) throw new Error('Active user with the expected role was not found; no changes made');

  const result = {
    userId: options.userId, previousRole: options.expectedRole, nextRole: options.role,
    operator: options.operator, reason: options.reason, applied: options.apply,
  };
  if (!options.apply) return result;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const changed = await User.findOneAndUpdate(
        { _id: options.userId, role: options.expectedRole, isActive: true },
        { $set: { role: options.role } },
        { new: true, runValidators: true, session }
      );
      if (!changed) throw new Error('Account changed concurrently; no role change committed');

      await RoleChangeAudit.create([{
        userId: options.userId, previousRole: options.expectedRole, nextRole: options.role,
        operator: options.operator, reason: options.reason,
      }], { session });

      if (options.role === 'coach') {
        // An approved coach must configure rates/availability before accepting bookings.
        await CoachProfile.updateOne(
          { userId: options.userId },
          { $setOnInsert: { userId: options.userId, experienceYears: 0, pricingPerHour: 0, active: false } },
          { upsert: true, runValidators: true, session }
        );
      } else if (options.expectedRole === 'coach') {
        await CoachProfile.updateOne({ userId: options.userId }, { $set: { active: false } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const main = async () => {
  // Load server/.env only for explicit CLI execution, never when imported in tests.
  const { config } = await import('dotenv');
  config();
  const options = parseRoleProvisioningArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must explicitly identify the reviewed target database');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(JSON.stringify(await provisionRole(options)));
    if (!options.apply) console.log('Dry run only. Re-run the reviewed command with --apply to commit the role change and audit entry.');
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  main().catch(() => {
    // Driver errors can contain credentials/connection strings; avoid printing them.
    console.error('Role provisioning failed; no success is claimed. Check arguments, account state and database transaction support.');
    process.exitCode = 1;
  });
}
