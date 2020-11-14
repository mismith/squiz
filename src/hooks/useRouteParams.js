import { useRouteMatch } from 'react-router-dom';

export default function useRouteParams() {
  const { params = {} } = useRouteMatch();
  return params;
}
