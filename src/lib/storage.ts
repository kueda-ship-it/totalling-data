import type { ServiceRecord } from '../types/data';

const DB_NAME = 'electric-apollo-db';
const STORE_NAME = 'datasets';
const DB_VERSION = 1;

export interface DatasetMetadata {
    id: number;
    name: string;
    timestamp: number;
    recordCount: number;
}

export interface Dataset extends DatasetMetadata {
    data: ServiceRecord[];
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveDataset = async (name: string, data: ServiceRecord[]): Promise<number> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const dataset: Omit<Dataset, 'id'> = {
        name,
        data,
        timestamp: Date.now(),
        recordCount: data.length
    };

    return new Promise((resolve, reject) => {
        const request = store.add(dataset);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const listDatasets = async (): Promise<DatasetMetadata[]> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            const result = request.result as Dataset[];
            // Only return metadata to keep list lightweight
            resolve(result.map(({ id, name, timestamp, recordCount }) => ({
                id, name, timestamp, recordCount
            })));
        };
        request.onerror = () => reject(request.error);
    });
};

export const loadDataset = async (id: number): Promise<Dataset> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result as Dataset);
        request.onerror = () => reject(request.error);
    });
};

export const deleteDataset = async (id: number): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
