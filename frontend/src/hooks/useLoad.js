import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../components/ToastProvider.jsx';

// Loads data from the API when the page opens and gives back a reload function.
//   const { data, loading, reload } = useLoad(() => api.getFruits(), []);
export default function useLoad(loader, dependencies = [], initialValue = []) {
  const toast = useToast();
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await loader();
      setData(response.data);
      setError('');
      return response;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload, setData };
}
