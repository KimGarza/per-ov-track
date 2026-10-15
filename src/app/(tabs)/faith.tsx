import { Redirect } from 'expo-router';
export default function LegacyPanelRoute() {
  return <Redirect href={{ pathname: '/', params: { panel: 'faith' } }} />;
}
