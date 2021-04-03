export const createServiceEndpoint: (option: {
  id: string;
  type: string;
  serviceEndpoint: string;
}) => any = ({ id, type, serviceEndpoint }) => ({
  id,
  type,
  serviceEndpoint,
});
