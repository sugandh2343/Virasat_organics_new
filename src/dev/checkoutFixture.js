// This entire module is imported only behind import.meta.env.DEV.
export const checkoutFixture = {
 catalogue:[
  {id:'checkout-ui-sample-a',slug:'checkout-ui-sample-a',name:'Illustrative pantry sample',size:'Demo pack A',images:[],status:'active',price:100,stock:4},
  {id:'checkout-ui-sample-b',slug:'checkout-ui-sample-b',name:'Illustrative pantry sample',size:'Demo pack B',images:[],status:'active',price:150,stock:3},
 ],
 cart:[{productId:'checkout-ui-sample-a',quantity:2},{productId:'checkout-ui-sample-b',quantity:1}],
 checkoutSettings:{shipping:20,tax:0,codEnabled:true},
};
