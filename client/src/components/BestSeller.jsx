import React from 'react'
import ProductCard from './ProductCard'
import { useAppContext } from '../context/AppContext';

function BestSeller() {
  const {products} = useAppContext();
  return (
    <div className='mt-16'>
        <p className='text-2xl md:text-sxl font-medium'>
            Best sellers
        </p>

        <div className='grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 mt-6'>
          {products.filter((product)=> product.inStock).slice(0,5).map((product, index)=>(
            <ProductCard key={index} product={product}/>
          ))
          }
            <ProductCard product={products[0]} />

        </div>
      
    </div>
  )
}

export default BestSeller
