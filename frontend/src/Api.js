import axios from 'axios'

const API = axios.create({
    baseURL: 'http://localhost:8000',
});

export const analyzeSymptoms = (symptoms, model) =>
    API.post('/analyze', {symptoms, model});