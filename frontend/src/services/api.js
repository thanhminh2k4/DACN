import axios from 'axios';

const api = axios.create({
    baseURL: '[https://studyhoclic-api.onrender.com/api](https://studyhoclic-api.onrender.com/api)'
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;