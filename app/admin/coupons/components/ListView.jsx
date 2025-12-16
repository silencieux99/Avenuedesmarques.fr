"use client";

import { useCoupons } from "@/lib/firestore/coupons/read";
import { deleteCoupon } from "@/lib/firestore/coupons/write";
import {
    Button,
    Chip,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
} from "@nextui-org/react";
import { Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ListView() {
    const { data: coupons, error, isLoading } = useCoupons();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex justify-center w-full p-10">
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return <div>{error}</div>;
    }

    const handleDelete = async (id) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce code promo ?")) {
            try {
                await deleteCoupon({ id });
                toast.success("Code promo supprimé");
            } catch (error) {
                toast.error(error?.message);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-4 md:pr-5 md:px-0 px-5 rounded-xl w-full">
            <Table aria-label="Table des codes promo">
                <TableHeader>
                    <TableColumn>CODE</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>VALEUR</TableColumn>
                    <TableColumn>STATUT</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent={"Aucun code promo trouvé."}>
                    {coupons?.map((item) => (
                        <TableRow key={item?.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm uppercase">{item?.code}</span>
                                    {item?.description && (
                                        <span className="text-xs text-gray-400">{item?.description}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm capitalize">
                                    {item?.type === "percent" ? "Pourcentage" : "Montant fixe"}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="font-semibold text-sm">
                                    {item?.type === "percent" ? `${item?.value}%` : `${item?.value}€`}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    color={item?.isActive ? "success" : "danger"}
                                    size="sm"
                                    variant="flat"
                                >
                                    {item?.isActive ? "Actif" : "Inactif"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Tooltip content="Modifier">
                                        <span
                                            className="p-2 hover:bg-gray-100 rounded-full text-default-500 cursor-pointer active:opacity-50"
                                            onClick={() => router.push(`/admin/coupons/form?id=${item?.id}`)}
                                        >
                                            <Edit2 size={16} />
                                        </span>
                                    </Tooltip>
                                    <Tooltip color="danger" content="Supprimer">
                                        <span
                                            className="p-2 hover:bg-red-50 rounded-full text-danger cursor-pointer active:opacity-50"
                                            onClick={() => handleDelete(item?.id)}
                                        >
                                            <Trash2 size={16} />
                                        </span>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
