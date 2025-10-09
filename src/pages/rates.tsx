import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData, Rate, BoardType } from "@/contexts/data-context";
import { Plus, Info, ShoppingBag, Pencil, Trash2 } from "lucide-react";
import { BOARD_TYPE_LABELS, calculatePriceBreakdown } from "@/lib/pricing";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
// import { Checkbox } from '@/components/ui/checkbox'

export function Rates() {
  const navigate = useNavigate();
  const { rates, contracts, hotels, addRate, updateRate, deleteRate } =
    useData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [formData, setFormData] = useState({
    contract_id: 0,
    room_group_id: "",
    board_type: "bed_breakfast" as BoardType,
    rate: 0, // Double occupancy rate (default)
    single_supplement: 0, // Optional: reduction for single use (1 person in double room)
    offer_single_rate: false,
    triple_rate: 0, // Optional: rate for triple occupancy (3 people)
    offer_triple_rate: false,
  });

  // Get selected contract details
  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === formData.contract_id),
    [contracts, formData.contract_id]
  );

  // Get room groups from selected contract's hotel
  const availableRoomGroups = useMemo(() => {
    if (!selectedContract) return [];
    const hotel = hotels.find((h) => h.id === selectedContract.hotel_id);
    return hotel?.room_groups || [];
  }, [selectedContract, hotels]);

  // Get selected room group for capacity validation
  const selectedRoomGroup = useMemo(() => {
    if (!selectedContract || !formData.room_group_id) return null;
    const hotel = hotels.find((h) => h.id === selectedContract.hotel_id);
    return hotel?.room_groups.find((rg) => rg.id === formData.room_group_id);
  }, [selectedContract, formData.room_group_id, hotels]);

  // Auto-populate contract defaults when contract is selected
  useEffect(() => {
    if (selectedContract && formData.rate === 0) {
      setFormData((prev) => ({
        ...prev,
        rate: selectedContract.base_rate,
      }));
    }
  }, [selectedContract, formData.rate]);

  // Calculate full cost for each rate
  const ratesWithFullCost = useMemo(
    () =>
      rates.map((rate) => {
        const contract = contracts.find((c) => c.id === rate.contract_id);
        if (!contract) return { ...rate, fullCost: rate.rate };

        // Use stored board cost from rate, or fallback to contract
        const boardCost = rate.board_cost !== undefined ? rate.board_cost : 
          contract.board_options?.find(o => o.board_type === rate.board_type)?.additional_cost || 0;

        const breakdown = calculatePriceBreakdown(
          rate.rate, // Use stored base rate directly
          contract,
          "double",
          1,
          boardCost
        );

        return {
          ...rate,
          fullCost: breakdown.totalCost,
        };
      }),
    [rates, contracts]
  );

  const handleCreateListingFromRate = (rate: Rate & { fullCost: number }) => {
    const contract = contracts.find((c) => c.id === rate.contract_id);
    if (!contract) {
      toast.error("Contract not found");
      return;
    }

    // Store rate data in sessionStorage to pre-fill listing form
    sessionStorage.setItem(
      "prefillListingFromRate",
      JSON.stringify({
        contract_id: rate.contract_id,
        room_group_id: rate.room_group_id,
        occupancy_type: rate.occupancy_type,
        board_type: rate.board_type,
        cost_price: rate.fullCost,
        purchase_type: "inventory",
        // Pass contract details for validation
        max_quantity: contract.total_rooms,
      })
    );
    toast.success("Opening listings page with pre-filled data");
    navigate("/listings");
  };

  const handleCreate = () => {
    // Validation
    if (formData.contract_id === 0) {
      toast.error("Please select a contract");
      return;
    }
    if (!formData.room_group_id) {
      toast.error("Please select a room type");
      return;
    }
    if (formData.rate <= 0) {
      toast.error("Please enter a valid double occupancy rate");
      return;
    }

    // Validate triple capacity if triple rate is selected
    if (
      formData.offer_triple_rate &&
      selectedRoomGroup &&
      selectedRoomGroup.capacity < 3
    ) {
      const proceed = confirm(
        `⚠️ Warning: Triple occupancy selected but room capacity is only ${selectedRoomGroup.capacity} people.\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    // Create single MVP rate (assumed double occupancy)
    // Store base rate only, board cost separately
    const boardOption = selectedContract?.board_options?.find(
      (o) => o.board_type === formData.board_type
    );

    addRate({
      contract_id: formData.contract_id,
      room_group_id: formData.room_group_id,
      occupancy_type: "double",
      board_type: formData.board_type,
      rate: formData.rate, // Store base rate only
      board_cost: boardOption?.additional_cost || 0, // Store board cost separately
    });
    toast.success("Rate created successfully");

    setIsCreateOpen(false);
    setFormData({
      contract_id: 0,
      room_group_id: "",
      board_type: "bed_breakfast",
      rate: 0,
      single_supplement: 0,
      offer_single_rate: false,
      triple_rate: 0,
      offer_triple_rate: false,
    });
  };

  const handleEdit = (rate: Rate) => {
    setEditingRate(rate);

    // Use stored base rate directly (no need to subtract board cost)
    setFormData({
      contract_id: rate.contract_id || 0,
      room_group_id: rate.room_group_id,
      board_type: rate.board_type,
      rate: rate.rate, // Use stored base rate directly
      single_supplement: 0,
      offer_single_rate: false,
      triple_rate: 0,
      offer_triple_rate: false,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRate) return;

    // Validation
    if (formData.contract_id === 0) {
      toast.error("Please select a contract");
      return;
    }
    if (!formData.room_group_id) {
      toast.error("Please select a room type");
      return;
    }
    if (formData.rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }

    // Store base rate only, board cost separately
    const boardOption = selectedContract?.board_options?.find(
      (o) => o.board_type === formData.board_type
    );

    updateRate(editingRate.id, {
      contract_id: formData.contract_id,
      room_group_id: formData.room_group_id,
      occupancy_type: editingRate.occupancy_type, // Keep existing occupancy
      board_type: formData.board_type,
      rate: formData.rate, // Store base rate only
      board_cost: boardOption?.additional_cost || 0, // Store board cost separately
    });
    toast.success("Rate updated successfully");
    setIsEditOpen(false);
    setEditingRate(null);
    setFormData({
      contract_id: 0,
      room_group_id: "",
      board_type: "bed_breakfast",
      rate: 0,
      single_supplement: 0,
      offer_single_rate: false,
      triple_rate: 0,
      offer_triple_rate: false,
    });
  };

  const handleDelete = (rate: Rate) => {
    if (confirm(`Are you sure you want to delete this rate?`)) {
      deleteRate(rate.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rates</h1>
          <p className="text-muted-foreground mt-1">
            Room rates per night. Occupancy assumed as double (MVP).
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rate
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* New Rate Dialog Content */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Rate</DialogTitle>
            <DialogDescription>
              Create a room rate per night. Occupancy is assumed as double for
              MVP.
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <Card className="bg-muted/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Contract Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Hotel:</span>
                    <p className="font-medium">{selectedContract.hotelName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Rate:</span>
                    <p className="font-medium">
                      {selectedContract.base_rate} {selectedContract.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax Rate:</span>
                    <p className="font-medium">
                      {((selectedContract.tax_rate || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Period:</span>
                    <p className="font-medium">
                      {selectedContract.start_date} to{" "}
                      {selectedContract.end_date}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contract_id">Contract *</Label>
              <Select
                value={formData.contract_id.toString()}
                onValueChange={(value) => {
                  const contractId = parseInt(value);
                  setFormData({
                    ...formData,
                    contract_id: contractId,
                    room_group_id: "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem
                      key={contract.id}
                      value={contract.id.toString()}
                    >
                      {contract.contract_name} - {contract.hotelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="room_group_id">Room Type *</Label>
              <Select
                value={formData.room_group_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, room_group_id: value })
                }
                disabled={!selectedContract}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedContract
                        ? "Select a room type"
                        : "Select a contract first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableRoomGroups.map((roomGroup) => (
                    <SelectItem key={roomGroup.id} value={roomGroup.id}>
                      {roomGroup.room_type} (Capacity: {roomGroup.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="board_type">Board/Meal Plan *</Label>
              <Select
                value={formData.board_type}
                onValueChange={(value: BoardType) => {
                  setFormData({ ...formData, board_type: value });
                }}
                disabled={
                  !selectedContract ||
                  !selectedContract.board_options ||
                  selectedContract.board_options.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedContract?.board_options &&
                      selectedContract.board_options.length > 0
                        ? "Select a board type"
                        : "No board options in contract"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedContract?.board_options?.map((option) => (
                    <SelectItem
                      key={option.board_type}
                      value={option.board_type}
                    >
                      {BOARD_TYPE_LABELS[option.board_type]}
                      {option.additional_cost > 0 &&
                        ` (+${option.additional_cost} ${selectedContract.currency})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContract &&
              selectedContract.board_options &&
              selectedContract.board_options.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Contract base rate: {selectedContract.base_rate}{" "}
                  {selectedContract.currency}. Adjust the rate below to include
                  board costs.
                </p>
              ) : (
                <p className="text-xs text-orange-600">
                  Please add board options to the contract first
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rate">
                Base Room Rate per Night (
                {selectedContract?.currency || "Currency"}) *
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Base room rate (before board costs)"
              />
              {selectedContract && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Contract base rate: {selectedContract.base_rate}{" "}
                    {selectedContract.currency}
                  </p>
                  {(() => {
                    const boardOption = selectedContract.board_options?.find(
                      (o) => o.board_type === formData.board_type
                    );
                    const totalRate =
                      formData.rate + (boardOption?.additional_cost || 0);
                    return (
                      <p className="font-medium text-blue-600">
                        Total rate with {BOARD_TYPE_LABELS[formData.board_type]}
                        : {formatCurrency(totalRate)}{" "}
                        {selectedContract.currency}
                        {boardOption &&
                          boardOption.additional_cost > 0 &&
                          ` (+${boardOption.additional_cost} board cost)`}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Occupancy options removed for MVP */}

            {/* Cost Breakdown Preview */}
            {selectedContract && formData.rate > 0 && (
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Full Cost Breakdown (per night, double occupancy)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  {(() => {
                    // Calculate board cost
                    const boardOption = selectedContract.board_options?.find(
                      (o) => o.board_type === formData.board_type
                    );
                    const boardCost = boardOption?.additional_cost || 0;

                    const breakdown = calculatePriceBreakdown(
                      formData.rate, // Base rate only
                      selectedContract,
                      "double",
                      1,
                      boardCost // Board cost passed separately
                    );
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Base Room Rate:
                          </span>
                          <span>{formatCurrency(formData.rate)}</span>
                        </div>

                        {breakdown.supplierCommission > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">
                              Supplier Commission (your discount):
                            </span>
                            <span>
                              -{formatCurrency(breakdown.supplierCommission)}
                            </span>
                          </div>
                        )}
                        {boardOption && boardOption.additional_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {BOARD_TYPE_LABELS[formData.board_type]} Cost:
                            </span>
                            <span>
                              +{formatCurrency(boardOption.additional_cost)}
                            </span>
                          </div>
                        )}
                        {breakdown.resortFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Resort Fee:
                            </span>
                            <span>+{formatCurrency(breakdown.resortFee)}</span>
                          </div>
                        )}
                        {breakdown.vat > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              VAT (
                              {(selectedContract.tax_rate! * 100).toFixed(0)}%):
                            </span>
                            <span>+{formatCurrency(breakdown.vat)}</span>
                          </div>
                        )}
                        {breakdown.cityTax > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              City Tax (2 people):
                            </span>
                            <span>+{formatCurrency(breakdown.cityTax)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Cost Price:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {formatCurrency(breakdown.totalCost)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                          This is your cost for 2 people sharing
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setFormData({
                  contract_id: 0,
                  room_group_id: "",
                  board_type: "bed_breakfast",
                  rate: 0,
                  single_supplement: 0,
                  offer_single_rate: false,
                  triple_rate: 0,
                  offer_triple_rate: false,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.contract_id || !formData.room_group_id}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm text-muted-foreground">
            Click the shopping bag icon to create a listing from a rate
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Room Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratesWithFullCost.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center text-sm">
                    <div>
                      <Badge variant="outline">{rate.contractName}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">{rate.roomName}</span>
                    </div>
                    <div>
                      <Badge variant="secondary">
                        {BOARD_TYPE_LABELS[rate.board_type]}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Base: {formatCurrency(rate.rate)}
                    </div>
                    <div className="font-semibold text-blue-600">
                      Cost: {formatCurrency(rate.fullCost)}
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateListingFromRate(rate)}
                        title="Create Listing from Rate"
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        List
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(rate)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {ratesWithFullCost.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No rates configured. Create your first rate above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rate</DialogTitle>
            <DialogDescription>
              Update rate information. Occupancy type cannot be changed.
            </DialogDescription>
          </DialogHeader>

          {selectedContract && editingRate && (
            <Card className="bg-muted/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Rate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Hotel:</span>
                    <p className="font-medium">{selectedContract.hotelName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Occupancy:</span>
                    <p className="font-medium capitalize">
                      {editingRate.occupancy_type}
                      {editingRate.occupancy_type === "single" &&
                        " (Single Supplement)"}
                      {editingRate.occupancy_type === "double" &&
                        " (2 people sharing)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-board_type">Board/Meal Plan *</Label>
              <Select
                value={formData.board_type}
                onValueChange={(value: BoardType) => {
                  setFormData({ ...formData, board_type: value });
                }}
                disabled={
                  !selectedContract ||
                  !selectedContract.board_options ||
                  selectedContract.board_options.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedContract?.board_options &&
                      selectedContract.board_options.length > 0
                        ? "Select a board type"
                        : "No board options in contract"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedContract?.board_options?.map((option) => (
                    <SelectItem
                      key={option.board_type}
                      value={option.board_type}
                    >
                      {BOARD_TYPE_LABELS[option.board_type]}
                      {option.additional_cost > 0 &&
                        ` (+${option.additional_cost} ${selectedContract.currency})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-rate">
                Base Room Rate per Night (
                {selectedContract?.currency || "Currency"}) *
              </Label>
              <Input
                id="edit-rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Base room rate (before board costs)"
              />
              {selectedContract && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Contract base rate: {selectedContract.base_rate}{" "}
                    {selectedContract.currency}
                  </p>
                  {(() => {
                    const boardOption = selectedContract.board_options?.find(
                      (o) => o.board_type === formData.board_type
                    );
                    const totalRate =
                      formData.rate + (boardOption?.additional_cost || 0);
                    return (
                      <p className="font-medium text-blue-600">
                        Total rate with {BOARD_TYPE_LABELS[formData.board_type]}
                        : {formatCurrency(totalRate)}{" "}
                        {selectedContract.currency}
                        {boardOption &&
                          boardOption.additional_cost > 0 &&
                          ` (+${boardOption.additional_cost} board cost)`}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Cost Breakdown Preview */}
            {selectedContract && formData.rate > 0 && editingRate && (
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Full Cost Breakdown (per night, {editingRate.occupancy_type}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  {(() => {
                    // Calculate board cost
                    const boardOption = selectedContract.board_options?.find(
                      (o) => o.board_type === formData.board_type
                    );
                    const boardCost = boardOption?.additional_cost || 0;

                    const breakdown = calculatePriceBreakdown(
                      formData.rate, // Base rate only
                      selectedContract,
                      editingRate.occupancy_type,
                      1,
                      boardCost // Board cost passed separately
                    );
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Base Room Rate:
                          </span>
                          <span>{formatCurrency(formData.rate)}</span>
                        </div>
                        {boardOption && boardOption.additional_cost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {BOARD_TYPE_LABELS[formData.board_type]} Cost:
                            </span>
                            <span>
                              +{formatCurrency(boardOption.additional_cost)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium">
                          <span className="text-muted-foreground">
                            Subtotal (Rate + Board):
                          </span>
                          <span>
                            {formatCurrency(formData.rate + boardCost)}
                          </span>
                        </div>
                        {breakdown.supplierCommission > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">
                              Supplier Commission (your discount):
                            </span>
                            <span>
                              -{formatCurrency(breakdown.supplierCommission)}
                            </span>
                          </div>
                        )}
                        {breakdown.resortFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Resort Fee:
                            </span>
                            <span>+{formatCurrency(breakdown.resortFee)}</span>
                          </div>
                        )}
                        {breakdown.vat > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              VAT (
                              {(selectedContract.tax_rate! * 100).toFixed(0)}%):
                            </span>
                            <span>+{formatCurrency(breakdown.vat)}</span>
                          </div>
                        )}
                        {breakdown.cityTax > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              City Tax:
                            </span>
                            <span>+{formatCurrency(breakdown.cityTax)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Cost Price:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {formatCurrency(breakdown.totalCost)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingRate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
