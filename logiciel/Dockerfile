# Image du service de régulation. Contexte de construction : racine du dépôt
# (voir edge/docker-compose.yml), pour embarquer aussi le dossier donnees/.
FROM python:3.12-slim
RUN pip install --no-cache-dir "paho-mqtt>=2.0"
WORKDIR /app/logiciel
COPY donnees /app/donnees
COPY logiciel/serre_core /app/logiciel/serre_core
ENV PYTHONUNBUFFERED=1
