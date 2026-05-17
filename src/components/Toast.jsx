import { useToast } from '../store';

export default function Toast() {
  const { toast } = useToast();
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`}>
      {toast.message}
    </div>
  );
}
