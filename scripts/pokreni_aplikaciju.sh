#!/bin/bash
docker compose down
docker compose up -d --build
echo "Application running at http://localhost:5173 (Frontend) and http://localhost:8000 (Backend)"
