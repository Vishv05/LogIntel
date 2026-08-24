FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV API_URL=http://backend:8000/api/logs/ingest
ENV SIM_MODE=stream
ENV INTERVAL=3.0

CMD python simulator.py --api-url $API_URL --mode $SIM_MODE --interval $INTERVAL
