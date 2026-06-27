FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p upload_audio prompts static/images
EXPOSE 5000
CMD ["python", "spectart.py"]
