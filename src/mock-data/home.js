export const homeContent = {
  id: 'homepage-main', slug: 'home',
  sections: ['hero','categories','collection','introduction','gallery','story','values','journal','testimonials','newsletter'].map((id,order)=>({id,order,enabled:id!=='testimonials'})),
  story: { eyebrow:'ROOTED IN TRADITION', title:'More than a brand,\na legacy in every grain.', description:'Virasat Organics celebrates familiar flavours, thoughtful ingredients and the traditions that make everyday food meaningful.', image:{src:null,subject:'field',caption:'Fields & agricultural heritage'}, action:{label:'Our Story',to:'/our-story'} },
  values: { title:'The values we carry', items:[
    {id:'tradition',icon:'wheat',title:'Rooted in Tradition',description:'Inspired by the food traditions we carry forward.'},
    {id:'selection',icon:'sprout',title:'Thoughtfully Selected',description:'A considered approach to everyday pantry essentials.'},
    {id:'goodness',icon:'heart',title:'Everyday Goodness',description:'Making space for meaningful meals, every day.'},
    {id:'care',icon:'leaf',title:'Care in Every Detail',description:'An appreciation for the small things that matter.'},
  ]},
  journal: {eyebrow:'NOTES FROM OUR PANTRY',title:'From Our Journal',description:'Stories, recipes and traditions worth sharing.',postIds:['draft-atta','draft-mustard','draft-traditions'],action:{label:'View All Articles',to:'/blog'},readLabel:'Read Article',draftLabel:'Editorial draft'},
  testimonials: {title:'Words from our community',description:null,items:[]},
  newsletter: {title:'Stay Connected',description:'Be the first to hear about new products, recipes and stories from Virasat Organics.',emailLabel:'Email address',placeholder:'Your email address',actionLabel:'Subscribe',invalidMessage:'Please enter a valid email address.',pendingMessage:'Newsletter subscriptions will be available soon',privacyNote:'Preview only. Your email is not saved or submitted.'},
  eyebrow: 'FROM OUR ROOTS TO YOUR HOME',
  title: 'Goodness,', emphasis: 'passed down.',
  description: 'Familiar flavours. Thoughtful ingredients.\nA little of our heritage in every meal.',
  action: { label: 'Shop Our Collection', to: '/shop' },
  secondaryAction: { label: 'Discover Our Story', to: '/our-story' },
  showcase: {
    eyebrow: 'THE VIRASAT PANTRY', title: 'Simple staples. A lasting tradition.',
    caption: 'Illustrative placeholders · Product photography coming soon',
    products: [
      { id: 'demo-black-oil-500ml', name: 'Black Mustard Oil', size: '500 ml', shape: 'bottle', tone: 'dark', image: null },
      { id: 'demo-black-oil-1l', name: 'Black Mustard Oil', size: '1 L', shape: 'bottle', tone: 'dark', image: null },
      { id: 'demo-atta-5kg', name: 'Atta', size: '5 kg', shape: 'pouch', tone: 'grain', image: null },
      { id: 'demo-yellow-oil-1l', name: 'Yellow Mustard Oil', size: '1 L', shape: 'bottle', tone: 'gold', image: null },
      { id: 'demo-yellow-oil-500ml', name: 'Yellow Mustard Oil', size: '500 ml', shape: 'bottle', tone: 'gold', image: null },
    ],
  },
  video: { title: 'Our Story in 60 Seconds', src: null, poster: null, captions: null, placeholder: 'Video coming soon', description: 'A glimpse of the people, places and traditions behind our pantry. Our film is still taking shape.' },
  media: {
    introduction: { eyebrow: 'A FILM ABOUT OUR ROOTS', title: 'From Our Roots, To Your Home', description: 'Every ingredient has a story. Discover the people, places and traditions behind Virasat Organics.', actionLabel: 'Watch Our Film', previewLabel: 'Fields, people & traditions' },
    gallery: { eyebrow: 'THE BEAUTY IN THE DETAILS', title: 'A Closer Look', description: 'Pure details. Thoughtful ingredients. The beauty of everyday goodness.', items: [
      { id:'gallery-fields', subject:'field', caption:'Golden wheat fields', src:null },
      { id:'gallery-grains', subject:'grain', caption:'Wheat grains', src:null },
      { id:'gallery-atta', subject:'flour', caption:'Freshly milled atta', src:null },
      { id:'gallery-black-seeds', subject:'seeds', caption:'Black mustard seeds', src:null },
      { id:'gallery-flowers', subject:'flowers', caption:'Yellow mustard flowers', src:null },
      { id:'gallery-pouring', subject:'oil', caption:'Mustard oil pouring into a bowl', src:null },
      { id:'gallery-products', subject:'products', caption:'Virasat Organics product photographs', src:null },
    ] },
  },
  shopping: {
    categories: { eyebrow: 'THE EVERYDAY PANTRY', title: 'Shop by Category', description: 'Everyday essentials, thoughtfully selected.' },
    collection: { eyebrow: 'FROM OUR PANTRY TO YOURS', title: 'Our Collection', description: 'Goodness for everyday living.', actionLabel: 'View All Products', editorial: { enabled: true, title: 'Good food grows a brighter tomorrow.', signature: 'Virasat Organics' } },
  },
  highlights: [
    { id: 'sourcing', icon: 'sprout', label: 'Thoughtfully Sourced' },
    { id: 'tradition', icon: 'wheat', label: 'Rooted in Tradition' },
    { id: 'everyday', icon: 'heart', label: 'Made for Everyday Goodness' },
  ],
};



