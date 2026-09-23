import api from "./api";

/**
 * AI Project Discovery API Service
 */

export const startDiscovery = (initialIdea, language = "en") =>
  api.post("/projects/discovery/start", { initialIdea, language });

export const getDiscoverySession = (id) =>
  api.get(`/projects/discovery/${id}`);

export const updateDiscoveryLanguage = (id, language) =>
  api.patch(`/projects/discovery/${id}/language`, { language });

export const answerDiscoveryQuestion = (id, answer) =>
  api.post(`/projects/discovery/${id}/answer`, { answer });

export const generateBlueprint = (id) =>
  api.post(`/projects/discovery/${id}/generate-blueprint`);

export const updateBlueprint = (id, payload) =>
  api.put(`/projects/discovery/${id}/blueprint`, payload);

export const regenerateBlueprint = (id) =>
  api.post(`/projects/discovery/${id}/regenerate`);

export const completeDiscovery = (id, payload) =>
  api.post(`/projects/discovery/${id}/complete`, payload);

const discoveryApi = {
  startDiscovery,
  getDiscoverySession,
  updateDiscoveryLanguage,
  answerDiscoveryQuestion,
  generateBlueprint,
  updateBlueprint,
  regenerateBlueprint,
  completeDiscovery,
};

export default discoveryApi;
