import { Response, NextFunction } from 'express';
import { Academy } from '../models/Academy';
import { AuthenticatedRequest } from '../types';

// @desc    Register a new martial arts academy
// @route   POST /api/academies
// @access  Private (Academy Owner / Admin only)
export const registerAcademy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || (req.user.role !== 'academy_owner' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only academy owners or admins can register an academy' });
    }

    const { name, address, longitude, latitude, disciplines, description, schedule, gallery } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Longitude and latitude are required for geospatial location mapping' });
    }

    const academy = await Academy.create({
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      ownerId: req.user._id,
      disciplines: disciplines || [],
      description: description || '',
      schedule: schedule || '',
      gallery: gallery || [],
    });

    res.status(201).json({
      success: true,
      message: 'Academy registered successfully in directory',
      academy,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search academies with filters (discipline, distance, location query)
// @route   GET /api/academies
// @access  Private
export const getAcademies = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { search, discipline, lat, lng, maxDistanceKm } = req.query;

    const filterQuery: any = {};

    // 1. Text search by name
    if (search) {
      filterQuery.name = { $regex: search, $options: 'i' };
    }

    // 2. Discipline filter
    if (discipline) {
      filterQuery.disciplines = discipline;
    }

    // 3. Geospatial distance filter
    if (lat && lng) {
      const distance = maxDistanceKm ? Number(maxDistanceKm) : 10; // Default 10km radius
      filterQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: distance * 1000, // MongoDB distance in meters
        },
      };
    }

    const academies = await Academy.find(filterQuery)
      .populate('ownerId', 'name email')
      .exec();

    res.status(200).json({
      success: true,
      count: academies.length,
      academies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get academy details by ID
// @route   GET /api/academies/:id
// @access  Private
export const getAcademyById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const academy = await Academy.findById(req.params.id).populate('ownerId', 'name email');
    if (!academy) {
      return res.status(404).json({ success: false, message: 'Academy not found' });
    }

    res.status(200).json({
      success: true,
      academy,
    });
  } catch (error) {
    next(error);
  }
};
