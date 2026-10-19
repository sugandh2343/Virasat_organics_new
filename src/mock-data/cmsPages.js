import { informationPages } from './navigation';
import { publicRoutes } from '../routes/registry';
export const cmsPages = publicRoutes.filter(route => route.kind === 'cms').map(route => ({
  id: 'cms-' + route.path.slice(1), slug: route.path.slice(1), title: informationPages.find(page => page.path === route.path)?.title || route.label,
  description: informationPages.find(page => page.path === route.path)?.description || 'This content is being prepared. This is a static placeholder, not a published policy or live service.',
  body: null, status: 'placeholder', seo: {title: route.label + ' | Virasat Organics', description:null},
}));

