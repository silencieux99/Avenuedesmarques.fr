"use client";

import { useCoupon } from "@/lib/firestore/coupons/read";
import { createNewCoupon, updateCoupon } from "@/lib/firestore/coupons/write";
import { Button, Input, Select, SelectItem, Switch, Textarea } from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const { data: coupon, isLoading: isCouponLoading } = useCoupon({ id });
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            type: "percent",
            isActive: true
        }
    });

    useEffect(() => {
        if (coupon) {
            reset(coupon);
            setValue("isActive", coupon?.isActive ?? true);
            setValue("type", coupon?.type || "percent");
        }
    }, [coupon, reset, setValue]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formattedData = {
                ...data,
                value: parseFloat(data.value),
                code: data.code.toUpperCase().trim(),
            };

            if (id) {
                await updateCoupon({ data: formattedData });
                toast.success("Code promo modifié");
            } else {
                await createNewCoupon({ data: formattedData });
                toast.success("Code promo créé");
            }
            router.push("/admin/coupons");
        } catch (error) {
            toast.error(error?.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (id && isCouponLoading) {
        return <div className="p-10">Chargement...</div>;
    }

    return (
        <main className="flex flex-col gap-4 p-5 max-w-2xl mx-auto w-full">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">{id ? "Modifier" : "Ajouter"} un Code Promo</h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 bg-white p-6 rounded-xl border">

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Code Promo</label>
                    <Input
                        placeholder="Ex: SOLDES2024"
                        {...register("code", { required: "Le code est requis" })}
                        isInvalid={!!errors.code}
                        errorMessage={errors.code?.message}
                        onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                        isDisabled={!!id} // Code is ID, cannot change after creation easily
                        description="Le code que le client doit entrer (majuscules automatiques)."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Description (Optionnel)</label>
                    <Textarea
                        placeholder="Ex: -20% sur tout le site pendant les soldes"
                        {...register("description")}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Type de Réduction</label>
                        <Select
                            selectedKeys={[watch("type")]}
                            onChange={(e) => setValue("type", e.target.value)}
                            disallowEmptySelection
                        >
                            <SelectItem key="percent" value="percent">Pourcentage (%)</SelectItem>
                            <SelectItem key="fixed" value="fixed">Montant Fixe (€)</SelectItem>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Valeur</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={watch("type") === "percent" ? "20" : "10"}
                            {...register("value", { required: "La valeur est requise", min: 0 })}
                            endContent={watch("type") === "percent" ? "%" : "€"}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Activer le code</span>
                    <Switch
                        isSelected={watch("isActive")}
                        onValueChange={(val) => setValue("isActive", val)}
                    />
                </div>

                <div className="flex gap-2 justify-end mt-4">
                    <Button variant="flat" onClick={() => router.back()}>
                        Annuler
                    </Button>
                    <Button color="primary" type="submit" isLoading={isLoading}>
                        {id ? "Mettre à jour" : "Créer le code"}
                    </Button>
                </div>

            </form>
        </main>
    );
}
