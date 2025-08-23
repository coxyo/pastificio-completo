// src/components/__tests__/sync.test.js
import { SyncService } from '../services/syncService';
import { WebSocketService } from '../services/webSocketService';
import { CacheService } from '../services/cacheService';

// Mock dei servizi
jest.mock('../services/webSocketService');
jest.mock('../services/cacheService');
jest.mock('../services/loggingService');

describe('SyncService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    CacheService.getPendingChanges.mockReturnValue([]);
    WebSocketService.isConnected.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    SyncService.stopAutoSync();
  });

  it('dovrebbe sincronizzare quando online', async () => {
    WebSocketService.isConnected.mockReturnValue(true);
    const mockInviaOrdine = jest.fn().mockResolvedValue({ success: true });
    WebSocketService.inviaOrdine = mockInviaOrdine;

    const testOrdine = {/* ... */};
    CacheService.getPendingChanges.mockReturnValue([testOrdine]);

    await SyncService.sync();
    jest.runAllTimers();

    expect(mockInviaOrdine).toHaveBeenCalledWith(testOrdine);
    expect(CacheService.removePendingChange).toHaveBeenCalled();
  });
});