import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsSaved = await AsyncStorage.getItem(
        '@GoMarketPlace:cartProducts',
      );
      productsSaved && setProducts(JSON.parse(productsSaved));
    }

    loadProducts();
  }, []);

  // Saving cart in storage
  const saveProducts = useCallback(async productsUpdated => {
    await AsyncStorage.setItem(
      '@GoMarketPlace:cartProducts',
      JSON.stringify(productsUpdated),
    );
  }, []);

  const addToCart = useCallback(
    async product => {
      // If the cart already have at least one product
      if (products.length > 0) {
        const [sameProduct] = products.filter(item => item.id === product.id);

        // If the product being added is already in cart
        if (sameProduct) {
          sameProduct.quantity += 1;
          const notSameProduct = products.filter(
            item => item.id !== product.id,
          );

          setProducts(() => {
            const productsUpdated = [...notSameProduct, sameProduct];
            saveProducts(productsUpdated);
            return productsUpdated;
          });
        } else {
          // If it's a new product being added
          setProducts(() => {
            const productsUpdated = [...products, { ...product, quantity: 1 }];
            saveProducts(productsUpdated);
            return productsUpdated;
          });
        }
      } else {
        // If there is no product in cart
        setProducts(() => {
          const productsUpdated = [{ ...product, quantity: 1 }];
          saveProducts(productsUpdated);
          return productsUpdated;
        });
      }
    },

    [products, saveProducts],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(item => {
        return item.id === id ? { ...item, quantity: item.quantity + 1 } : item;
      });
      setProducts(productsUpdated);
      saveProducts(productsUpdated);
    },
    [products, saveProducts],
  );

  const decrement = useCallback(
    async id => {
      const [product] = products.filter(item => item.id === id);

      if (product.quantity === 1) {
        const productsUpdated = products.filter(item => item.id !== id);
        setProducts(productsUpdated);
        saveProducts(productsUpdated);
      } else {
        const productsUpdated = products.map(item => {
          return item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item;
        });

        setProducts(productsUpdated);
        saveProducts(productsUpdated);
      }
    },
    [products, saveProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
