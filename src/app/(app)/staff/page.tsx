"use client";
import React, { useState } from "react";
import { PlusIcon } from "lucide-react";
import StaffCard from "./StaffCard";
import StaffFormDialog from "./StaffFormDialog";
import useDataStore from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import { notifySuccess } from "@/src/Components/admin/notify";
import { Button } from "@/src/Components/ui/button";
import { Card } from "@/src/Components/ui/card";

const Staff = () => {
  const { staff, ready, addStaff } = useDataStore();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader title="Staff">
        <Button type="button" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon aria-hidden /> Add staff member
        </Button>
      </PageHeader>

      {ready && staff.length === 0 && (
        <Card className="items-center px-6 py-12 text-center text-muted-foreground">
          <p>No staff yet. Add the first member with the button above.</p>
        </Card>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {staff.map((member) => (
          <StaffCard key={member.id} {...member} />
        ))}
      </ul>

      <StaffFormDialog
        open={adding}
        onOpenChange={setAdding}
        save={addStaff}
        onSaved={(member) => notifySuccess(`${member.FName} ${member.Lname} was added`)}
      />
    </div>
  );
};

export default Staff;
