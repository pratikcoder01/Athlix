FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    CV_STATE_DIR=/var/lib/athlix-cv CV_TEMP_DIR=/tmp/athlix-cv \
    CV_MODEL_PATH=/models/pose.task \
    OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 athlix \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin athlix \
    && mkdir -p /var/lib/athlix-cv /models \
    && chown 10001:10001 /var/lib/athlix-cv
COPY requirements.txt constraints.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt && python -m pip check
COPY --chown=10001:10001 main.py task_store.py video_safety.py ./
COPY --chown=10001:10001 native_smoke.py provision_model.py model-manifest.json ./
COPY --chown=10001:10001 cv ./cv
COPY --chown=10001:10001 ai ./ai
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/ready',timeout=3)" || exit 1
CMD ["sh", "-c", "exec python -m uvicorn main:app --host 0.0.0.0 --port \"${PORT:-8000}\" --workers 1 --limit-concurrency 4 --timeout-keep-alive 5 --timeout-graceful-shutdown 10"]
