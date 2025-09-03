// import { config } from '~/src/config/config.js'

const uploadstatusController = {
  handler: async (request, h) => {
    try {
      console.log("request", request.query.uploadId)
      const { statusUrl } = request.yar.get('basic-upload')
      const response = await fetch(statusUrl);
      if(!response.ok) {
        throw new Error('Status check failed');
      }
      const statusData = await response.json();
      console.log("statusData", statusData)
      return h.response(statusData).code(200);
    } catch (error) {
      console.error("Error fetching status:", error);
      return h.response({ error: 'Error fetching status' }).code(500);
    }

  }}
export { uploadstatusController}
  
