import * as cms from './cmsApi';
import {apiMode,publicCategories,publicProducts} from './catalogueApi';
import { resolveMediaReferences,businessDefaults } from '../domain/contentSelectors';
import { readMock, updateMockRecord, updateMockSettings } from './mockStore';
export const getCategories = async () => apiMode ? publicCategories() : (await readMock('categories')).filter(category => category.status === 'active').sort((a,b)=>(a.sortOrder || 0)-(b.sortOrder || 0));
const projected=async key=>resolveMediaReferences(await readMock(key),await readMock('productMedia'));
export const getHomepageContent = () => apiMode ? cms.publicContent('/homepage') : projected('homepage');
export const getBanners = async () => (apiMode ? await cms.contentList('/banners') : await projected('banners')).filter(item=>item.status==='active').sort((a,b)=>a.sortOrder-b.sortOrder);
export const getBusinessSettings = async () => businessDefaults(apiMode ? await cms.publicContent('/settings/public') : await projected('business'));
export const getBlogPosts = async () => (apiMode ? await cms.contentList('/blog') : await projected('blogPosts')).filter(post => post.status === 'published');
export const getEditorialPreviews = async () => (apiMode ? await cms.contentList('/blog') : await projected('blogPosts')).filter(post => post.status === 'published' || (post.status === 'editorial_draft' && post.previewEnabled === true));
export const getBlogPostBySlug = async slug => apiMode ? cms.contentDetail('/blog/'+encodeURIComponent(slug)) : (await getEditorialPreviews()).find(post => post.slug === slug) ?? null;
export const getCMSPages = () => apiMode ? Promise.all(['about','contact','privacy-policy','terms-and-conditions','shipping-policy','returns-refunds','faq','our-story'].map(slug=>cms.contentDetail('/pages/'+slug))).then(rows=>rows.filter(Boolean)) : projected('cmsPages');
export const getCMSPageBySlug = async slug => apiMode ? cms.contentDetail('/pages/'+encodeURIComponent(slug)) : (await getCMSPages()).find(page => page.slug === slug) ?? null;
export const getProductMedia = async productId => {if(apiMode){const p=(await publicProducts()).find(p=>p.id===productId);return p?[...p.images,...p.videos]:[];}return (await readMock('productMedia')).filter(media=>media.productId===productId);};
export const updateHomepageContent = patch => apiMode ? cms.saveHome(patch) : updateMockSettings('homepage', patch);
export const updateBusinessSettings = patch => apiMode ? cms.saveSettings(patch) : updateMockSettings('business', patch);
export const updateCMSPage = (id, patch) => apiMode ? cms.saveRecord('cmsPages',patch,id) : updateMockRecord('cmsPages', id, patch);
export const updateBlogPost = (id, patch) => apiMode ? cms.saveRecord('blogPosts',patch,id) : updateMockRecord('blogPosts', id, patch);



