# Homepage and product media
All current media are labelled placeholders. No authentic product photos or playable video have been supplied.

Configure `src/mock-data/home.js`: `video` is the single shared source for both the hero teaser and introductory section. Put the approved film at `public/assets/videos/our-story.mp4`, then set `video.src` to `/assets/videos/our-story.mp4`. Optional poster: `public/assets/story/intro-poster.webp`; set `video.poster` accordingly. Optional English captions: `/assets/videos/our-story.en.vtt`. Sources stay null until files exist. Playback is user-controlled, never autoplayed, and is paused/unmounted when closed.

Gallery slots in `media.gallery.items` accept `src`, `alt`, optional `srcSet` and `sizes`, plus their stable id/caption. Suggested files in `public/assets/gallery/`: golden-wheat-fields.webp, wheat-grains.webp, milled-atta.webp, black-mustard-seeds.webp, yellow-mustard-flowers.webp, mustard-oil-pouring.webp, virasat-products.webp. Assign only approved actual images; the last slot must depict genuine Virasat products. Use `/assets/gallery/<filename>` URLs. Add approved brand/story imagery to `public/assets/story/`.

`ProductMediaViewer` accepts a centralized product record via `product`. Product `images` accept URL strings or `{src,alt,srcSet,sizes}` objects; `videos` accept URL strings or `{src,title,poster,captions}` objects. Store authentic product images in `public/assets/products/` and videos in `public/assets/videos/` or the existing product-videos directory. The component provides thumbnails, image enlargement, keyboard/swipe lightbox navigation and optional controlled video. It is prepared for Prompt 3.2; the product page is not rebuilt here.

Below-fold photos are lazy-loaded with reserved aspect ratios. Missing/failed photos use existing graceful fallbacks. Lightboxes use the shared native dialog shell for focus containment, Escape dismissal and focus restoration. No new dependencies, external APIs, commits or deployment.

## Product detail media (Prompt 3.2)
The live product detail page now uses ProductMediaViewer. Each product retains its own images[] and videos[] in src/mock-data/products.js. Empty image arrays show five clearly labelled suggested photo slots from src/mock-data/productDetail.js; these are not actual packaging photographs. No video thumbnail is shown for an empty videos array.

Reserved folders:
- public/assets/products/atta-5kg/
- public/assets/products/black-mustard-oil-500ml/
- public/assets/products/black-mustard-oil-1l/
- public/assets/products/yellow-mustard-oil-500ml/
- public/assets/products/yellow-mustard-oil-1l/

The 1-litre route slugs remain unchanged; folder names need not match route slugs.
Suggested filenames: front.webp, back.webp, close-up.webp, ingredients.webp, lifestyle.webp, product.mp4, poster.webp, captions.en.vtt.
Once files are supplied, configure the individual record, for example:
images: [{src:'/assets/products/atta-5kg/front.webp',alt:'Accurate description of the supplied photo',srcSet:'...',sizes:'...'}]
videos: [{src:'/assets/products/atta-5kg/product.mp4',title:'Atta product film',poster:'/assets/products/atta-5kg/poster.webp',captions:'/assets/products/atta-5kg/captions.en.vtt'}]
Omit srcSet and captions if not supplied. Do not configure nonexistent file paths. Any number of entries is supported. MP4 is user-controlled and unmounts/pauses on media changes or navigation. Missing/failed sources show a fallback. Arrow keys, previous/next buttons and thumbnails navigate the gallery; image buttons open the existing lightbox.
