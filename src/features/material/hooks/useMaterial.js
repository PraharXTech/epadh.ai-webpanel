import { useSelector } from 'react-redux';
import useExamLoader from '@/hooks/useExamLoader';
import { loadMaterial } from '../store/materialSlice';
import {
  selectMaterialError,
  selectLoadedMaterialExamIds,
  selectMaterialStatus,
} from '@/store/selectors/materialSelectors';

// Study material for the exams the student prepares for.
export default function useMaterial() {
  const status = useSelector(selectMaterialStatus);
  const error = useSelector(selectMaterialError);
  const { refresh, hasData } = useExamLoader(
    loadMaterial,
    useSelector(selectLoadedMaterialExamIds),
  );

  return { status, error, refresh, hasData };
}
