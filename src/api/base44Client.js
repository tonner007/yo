// Re-export mock client místo Base44 DB
import { db } from './mockClient';
export { db };
export const base44 = db;
export default db;