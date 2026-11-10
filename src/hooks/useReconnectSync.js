import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { syncPendingRank } from '@/features/mock/store/mockSlice';
import { syncSessions } from '@/features/study/store/studySlice';
import { subscribeNetwork } from '@/services/network/network';

// When the phone gets its connection back, send what was queued while offline: finished
// study sessions and the rank request of a mock test submitted offline. (The attempt in
// progress autosaves on its own timer.) Mount once in the logged-in area.
export default function useReconnectSync() {
  const dispatch = useDispatch();

  useEffect(
    () =>
      subscribeNetwork(online => {
        if (online) {
          dispatch(syncSessions());
          dispatch(syncPendingRank());
        }
      }),
    [dispatch],
  );
}
