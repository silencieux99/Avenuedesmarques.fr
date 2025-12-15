"use client";

import { useProducts } from "@/lib/firestore/products/read";
import { deleteProduct } from "@/lib/firestore/products/write";
import {
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  User,
  Image
} from "@nextui-org/react";
import { Edit2, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ListView() {
  const [pageLimit, setPageLimit] = useState(10);
  const [lastSnapDocList, setLastSnapDocList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setLastSnapDocList([]);
  }, [pageLimit]);

  const {
    data: products,
    error,
    isLoading,
    lastSnapDoc,
  } = useProducts({
    pageLimit: pageLimit,
    lastSnapDoc:
      lastSnapDocList?.length === 0
        ? null
        : lastSnapDocList[lastSnapDocList?.length - 1],
  });

  const handleNextPage = () => {
    let newStack = [...lastSnapDocList];
    newStack.push(lastSnapDoc);
    setLastSnapDocList(newStack);
  };

  const handlePrePage = () => {
    let newStack = [...lastSnapDocList];
    newStack.pop();
    setLastSnapDocList(newStack);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center w-full">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-3 md:pr-5 md:px-0 px-5 rounded-xl w-full">
      <Table aria-label="Liste des produits">
        <TableHeader>
          <TableColumn>PRODUIT</TableColumn>
          <TableColumn>PRIX</TableColumn>
          <TableColumn>STOCK</TableColumn>
          <TableColumn>COMMANDES</TableColumn>
          <TableColumn>STATUT</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Aucun produit trouvé."}>
          {products?.map((item) => (
            <TableRow key={item?.id}>
              <TableCell>
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <Image
                      src={item?.featureImageURL}
                      alt={item?.title}
                      className="h-10 w-10 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item?.title}</span>
                    {item?.isFeatured && (
                      <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-full w-fit">Mis en avant</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item?.salePrice)}
                  </span>
                  {item?.salePrice < item?.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item?.price)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={item?.stock < 5 ? "text-danger" : ""}>{item?.stock}</span>
              </TableCell>
              <TableCell>{item?.orders ?? 0}</TableCell>
              <TableCell>
                <Chip
                  color={item?.stock - (item?.orders ?? 0) > 0 ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                >
                  {item?.stock - (item?.orders ?? 0) > 0 ? "En Stock" : "Rupture"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tooltip content="Modifier">
                    <span className="text-lg text-default-400 cursor-pointer active:opacity-50" onClick={() => router.push(`/admin/products/form?id=${item?.id}`)}>
                      <Edit2 size={16} />
                    </span>
                  </Tooltip>
                  <Tooltip color="danger" content="Supprimer">
                    <span className="text-lg text-danger cursor-pointer active:opacity-50" onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
                        deleteProduct({ id: item?.id });
                        toast.success("Produit supprimé");
                      }
                    }}>
                      <Trash2 size={16} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center px-4">
        <Button
          isDisabled={isLoading || lastSnapDocList?.length === 0}
          onClick={handlePrePage}
          size="sm"
          variant="flat"
        >
          Précédent
        </Button>
        <select
          value={pageLimit}
          onChange={(e) => setPageLimit(e.target.value)}
          className="px-3 py-1 rounded-lg border text-sm"
        >
          <option value={5}>5 par page</option>
          <option value={10}>10 par page</option>
          <option value={20}>20 par page</option>
          <option value={50}>50 par page</option>
        </select>
        <Button
          isDisabled={isLoading || products?.length === 0}
          onClick={handleNextPage}
          size="sm"
          variant="flat"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
