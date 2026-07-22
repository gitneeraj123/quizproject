// import axios from 'axios';

// const API_URL = 'http://localhost:5000/api/v1/questions/';

// // Upload Excel to get the JSON preview
// const previewExcel = async (file) => {
//   const formData = new FormData();
//   formData.append('file', file);

//   const response = await axios.post(API_URL + 'preview-upload', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
//   return response.data;
// };

// // Confirm and save previewed questions to DB
// const confirmBulkUpload = async (questions) => {
//   const response = await axios.post(API_URL + 'bulk-confirm', { questions });
//   return response.data;
// };

// const questionService = {
//   previewExcel,
//   confirmBulkUpload,
// };

// export default questionService;

import api from './api'; // IMPORT OUR CUSTOM AXIOS INSTANCE

// Upload Excel to get the JSON preview
const previewExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  // Use 'api' instead of raw 'axios', and remove the full localhost URL
  const response = await api.post('/questions/preview-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const confirmBulkUpload = async (questions) => {
  const response = await api.post('/questions/bulk-confirm', { questions });
  return response.data;
};

export default { previewExcel, confirmBulkUpload };