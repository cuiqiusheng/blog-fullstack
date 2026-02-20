import { useParams } from 'react-router-dom';

export function ReactDemosPage() {
  const { name } = useParams<{ name?: string }>();

  if (!name) {
    return <div>No name provided</div>;
  }

  return <div>React Demo: {name}</div>;
}
