"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useUser } from '@/lib/firestore/user/read';
import { updateCarts } from '@/lib/firestore/user/write';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();
    const { data: userData, isLoading } = useUser({ uid: user?.uid });
    const [guestCart, setGuestCart] = useState([]);
    const hasMigrated = useRef(false);

    // Load guest cart from localStorage on mount
    useEffect(() => {
        if (!user) {
            const savedCart = localStorage.getItem('guestCart');
            if (savedCart) {
                try {
                    setGuestCart(JSON.parse(savedCart));
                } catch (e) {
                    console.error('Error loading guest cart:', e);
                    localStorage.removeItem('guestCart');
                }
            }
        }
    }, [user]);

    // Save guest cart to localStorage whenever it changes
    useEffect(() => {
        if (!user && guestCart.length >= 0) {
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
        }
    }, [guestCart, user]);

    // Migrate guest cart to user account when they log in
    useEffect(() => {
        if (user && !isLoading && userData && guestCart.length > 0 && !hasMigrated.current) {
            hasMigrated.current = true;

            const migrateCart = async () => {
                try {
                    const existingCart = userData?.carts || [];
                    const mergedCart = [...existingCart];

                    guestCart.forEach(guestItem => {
                        const existingIndex = mergedCart.findIndex(item => item.id === guestItem.id && item.size === guestItem.size);
                        if (existingIndex >= 0) {
                            mergedCart[existingIndex].quantity += guestItem.quantity;
                        } else {
                            mergedCart.push(guestItem);
                        }
                    });

                    await updateCarts({ list: mergedCart, uid: user.uid });
                    setGuestCart([]);
                    localStorage.removeItem('guestCart');
                } catch (error) {
                    console.error('Error migrating cart:', error);
                    hasMigrated.current = false;
                }
            };

            migrateCart();
        }
    }, [user, userData, isLoading, guestCart]);

    const cart = user ? (userData?.carts || []) : guestCart;

    const addToCart = async (productId, quantity = 1, size = null) => {
        const newItem = { id: productId, quantity, size };

        if (user) {
            // User is logged in - update Firestore
            const currentCart = userData?.carts || [];
            const existingIndex = currentCart.findIndex(item => item.id === productId && item.size === size);
            let newCart;

            if (existingIndex >= 0) {
                newCart = [...currentCart];
                newCart[existingIndex].quantity += quantity;
            } else {
                newCart = [...currentCart, newItem];
            }

            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            // Guest - update localStorage
            const existingIndex = guestCart.findIndex(item => item.id === productId && item.size === size);
            let newCart;

            if (existingIndex >= 0) {
                newCart = [...guestCart];
                newCart[existingIndex].quantity += quantity;
            } else {
                newCart = [...guestCart, newItem];
            }

            setGuestCart(newCart);
        }
    };

    // Remove specific item (id + size)
    const removeFromCart = async (productId, size = null) => {
        // If size is passed, match both. If not passed (legacy calls), remove all instances of product??
        // Safe bet: match id AND size if size is provided. But to be robust, let's assume UI handles unique items.
        // For now, let's stick to unique ID+Size removal. 
        // NOTE: Previous logic was just ID. If we have multiple sizes, removing by ID removes ALL sizes of that product.
        // Let's keep removing ALL variants of a product by ID for simplicity if size is not passed? 
        // No, better to be strict if we can. But current UI calls removeFromCart(productId).
        // Let's filter out only exact matches if size is provided, or all if not??
        // Actually, easiest migration: filter `item.id !== productId` removes all sizes of that product.
        // If we want to remove specific line, we need to pass size.
        // I will assume for now removeFromCart is "remove all of this product".

        const filterFn = (item) => {
            if (size) return !(item.id === productId && item.size === size);
            return item.id !== productId; // Remove all variants if size not specified
        };

        if (user) {
            const newCart = (userData?.carts || []).filter(filterFn);
            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            const newCart = guestCart.filter(filterFn);
            setGuestCart(newCart);
        }
    };

    const updateQuantity = async (productId, quantity, size = null) => {
        if (quantity <= 0) {
            await removeFromCart(productId, size);
            return;
        }

        const mapFn = (item) => {
            if (item.id === productId && (size ? item.size === size : true)) {
                // If multiple matches (e.g. no size specified but multiple variants), this updates all?? 
                // Let's assume size is passed for precision or only one variant exists.
                return { ...item, quantity };
            }
            return item;
        };

        if (user) {
            const newCart = (userData?.carts || []).map(mapFn);
            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            const newCart = guestCart.map(mapFn);
            setGuestCart(newCart);
        }
    };

    const clearCart = async () => {
        if (user) {
            await updateCarts({ list: [], uid: user.uid });
        } else {
            setGuestCart([]);
            localStorage.removeItem('guestCart');
        }
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount: cart.length,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}
