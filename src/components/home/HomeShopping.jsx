import { Link } from 'react-router-dom';
import { ArrowRight, Wheat, Droplets, Sprout } from 'lucide-react';
import { getCategories } from '../../services/contentService';
import { getProducts } from '../../services/productService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useStorefront } from '../../state/StorefrontContext';
import { categoryPath } from '../../routes/registry';
import ProductCard from '../ui/ProductCard';
import ResponsiveImage from '../ui/ResponsiveImage';
import SectionHeading from '../ui/SectionHeading';
import { SecondaryButton } from '../ui/Buttons';
import { LoadingState, ErrorState } from '../ui/PageStates';
import EmptyState from '../ui/EmptyState';
import '../../styles/home-shopping.css';
async function loadShopping() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return { categories, products };
}
export default function HomeShopping({ content, section }) {
  const { data, loading, error, retry } = useAsyncData(loadShopping);
  const { state, dispatch } = useStorefront();
  if (loading) return <LoadingState />;
  if (error) return <ErrorState retry={retry} />;
  return <div className="home-shopping">
    {(!section || section === 'categories') && <section className="container home-categories" aria-label={content.categories.title}>
      <SectionHeading eyebrow={content.categories.eyebrow} title={content.categories.title} description={content.categories.description} />
      <div className="home-category-grid">{data.categories.map(category => {
        const Icon = category.illustration === 'wheat' ? Wheat : Droplets;
        return <Link className="home-category-card" to={categoryPath(category.slug)} key={category.id}>
          <div className={'home-category-art home-category-art--' + category.illustration}>
            {category.image ? <ResponsiveImage src={category.image.src || category.image} alt={category.image.alt || category.name} aspectRatio="4 / 3" /> : <><span className="category-art-ring" aria-hidden="true"><Icon size={88} strokeWidth={.65} /></span><span className="category-art-note">Illustrative placeholder</span></>}
          </div>
          <div className="home-category-copy"><span className="home-gold-rule" aria-hidden="true" /><h3>{category.name}</h3><p>{category.description}</p><span className="category-shop">Shop Now <ArrowRight size={17} aria-hidden="true" /></span></div>
        </Link>;
      })}</div>
      {!data.categories.length && <EmptyState title="Our categories are taking shape." />}
    </section>}
    {(!section || section === 'collection') && <section className="container home-collection" aria-label={content.collection.title}>
      <SectionHeading eyebrow={content.collection.eyebrow} title={content.collection.title} description={content.collection.description}><SecondaryButton to={content.collection.actionTo || "/shop"}>{content.collection.actionLabel}<ArrowRight size={16} aria-hidden="true" /></SecondaryButton></SectionHeading>
      <div className={'home-collection-layout' + (content.collection.editorial.enabled ? ' has-editorial' : '')}>
        <div className="home-product-grid">{data.products.map(product => <ProductCard key={product.id} product={product} wishlisted={state.wishlist.includes(product.id)} onWishlist={item => dispatch({ type: 'wishlist/toggle', id: item.id })} onAddToCart={item => dispatch({ type: 'cart/add', product: item })} />)}</div>
        {content.collection.editorial.enabled && <aside className="home-collection-editorial"><Sprout size={36} strokeWidth={1} aria-hidden="true" /><span className="home-gold-rule" aria-hidden="true" /><p>{content.collection.editorial.title}</p><span className="editorial-signature">{content.collection.editorial.signature}</span></aside>}
      </div>
      {!data.products.length && <EmptyState title="Our collection is taking shape." description="Please check back for our next collection." />}
    </section>}
  </div>;
}

