"use client";

import { useUsers } from "@/lib/firestore/user/read";
import {
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from "@nextui-org/react";

export default function ListView() {
  const { data: users, error, isLoading } = useUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center w-full">
        <CircularProgress />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-3 md:pr-5 md:px-0 px-5 rounded-xl w-full">
      <Table aria-label="Tableau des clients">
        <TableHeader>
          <TableColumn>UTILISATEUR</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>RÔLE</TableColumn>
          <TableColumn>DATE D'INSCRIPTION</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Aucun client trouvé."}>
          {users?.map((item) => (
            <TableRow key={item?.id}>
              <TableCell>
                <User
                  avatarProps={{ radius: "lg", src: item?.photoURL }}
                  description={item?.email}
                  name={item?.displayName || "Nom inconnu"}
                >
                  {item?.email}
                </User>
              </TableCell>
              <TableCell>{item?.email}</TableCell>
              <TableCell className="capitalize">{item?.role || "user"}</TableCell>
              <TableCell>
                {/* Assuming timestamps are available, otherwise simpler fallback */}
                {item?.timestampCreate?.toDate().toLocaleDateString('fr-FR') || "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
