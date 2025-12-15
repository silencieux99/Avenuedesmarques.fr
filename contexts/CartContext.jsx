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
                        const existingIndex = mergedCart.findIndex(item => item.id === guestItem.id);
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

    const addToCart = async (productId, quantity = 1) => {
        if (user) {
            // User is logged in - update Firestore
            const existingItem = userData?.carts?.find(item => item.id === productId);
            let newCart;

            if (existingItem) {
                newCart = userData.carts.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                newCart = [...(userData?.carts || []), { id: productId, quantity }];
            }

            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            // Guest - update localStorage
            const existingItem = guestCart.find(item => item.id === productId);
            let newCart;

            if (existingItem) {
                newCart = guestCart.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                newCart = [...guestCart, { id: productId, quantity }];
            }

            setGuestCart(newCart);
        }
    };

    const removeFromCart = async (productId) => {
        if (user) {
            const newCart = userData?.carts?.filter(item => item.id !== productId) || [];
            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            const newCart = guestCart.filter(item => item.id !== productId);
            setGuestCart(newCart);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        if (user) {
            const newCart = userData?.carts?.map(item =>
                item.id === productId ? { ...item, quantity } : item
            ) || [];
            await updateCarts({ list: newCart, uid: user.uid });
        } else {
            const newCart = guestCart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            );
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
