"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Calendar,
  Building,
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  getAdminCitiesAction,
  createCityAction,
  updateCityAction,
  toggleCityActiveAction,
  deleteCityAction,
} from "@/app/actions/admin";
import { getCurrentAdminSessionAction } from "@/app/actions/auth";
import type { City } from "@/types/database";

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Role State
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    state: "",
    country: "USA",
    tour_date: "",
    venue_name: "",
    venue_address: "",
    max_capacity: 50,
    notes: "",
    is_active: true,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCities = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await getAdminCitiesAction();
    if (res.success && res.data) {
      setCities(res.data);
    } else {
      setErrorMessage(res.error || "Failed to load tour cities.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCities();
    getCurrentAdminSessionAction().then(({ session }) => {
      if (session) {
        setCurrentUserRole(session.role);
      }
    });
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await createCityAction({
      name: addForm.name,
      state: addForm.state,
      country: addForm.country,
      tour_date: addForm.tour_date,
      venue_name: addForm.venue_name,
      venue_address: addForm.venue_address,
      max_capacity: Number(addForm.max_capacity),
      notes: addForm.notes,
      is_active: addForm.is_active,
    });

    if (res.success && res.data) {
      setSuccessMessage(res.message || "Tour city added successfully.");
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        state: "",
        country: "USA",
        tour_date: "",
        venue_name: "",
        venue_address: "",
        max_capacity: 50,
        notes: "",
        is_active: true,
      });
      await fetchCities();
    } else {
      setErrorMessage(res.error || "Failed to add tour city.");
    }
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await updateCityAction(editingCity.id, {
      name: editingCity.name,
      state: editingCity.state,
      country: editingCity.country || "USA",
      tour_date: editingCity.tour_date,
      venue_name: editingCity.venue_name,
      venue_address: editingCity.venue_address,
      max_capacity: Number(editingCity.max_capacity),
      notes: editingCity.notes,
      is_active: editingCity.is_active,
    });

    if (res.success) {
      setSuccessMessage(res.message || "Tour city updated.");
      setIsEditModalOpen(false);
      setEditingCity(null);
      await fetchCities();
    } else {
      setErrorMessage(res.error || "Failed to update city.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteSubmit = async () => {
    if (!cityToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);

    const res = await deleteCityAction(cityToDelete.id);
    if (res.success) {
      setSuccessMessage(res.message || "Tour stop deleted successfully.");
      setIsDeleteModalOpen(false);
      setCityToDelete(null);
      await fetchCities();
    } else {
      setErrorMessage(res.error || "Failed to delete tour stop.");
    }
    setIsDeleting(false);
  };

  const handleToggleActive = async (city: City) => {
    const newState = !city.is_active;
    const res = await toggleCityActiveAction(city.id, newState);
    if (res.success) {
      setCities((prev) =>
        prev.map((c) => (c.id === city.id ? { ...c, is_active: newState } : c))
      );
      setSuccessMessage(res.message || "City status updated.");
    } else {
      setErrorMessage(res.error || "Failed to update city status.");
    }
  };

  // Filtered cities list
  const filteredCities = cities.filter((city) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      city.name.toLowerCase().includes(query) ||
      city.state.toLowerCase().includes(query) ||
      (city.venue_name && city.venue_name.toLowerCase().includes(query)) ||
      (city.venue_address && city.venue_address.toLowerCase().includes(query)) ||
      city.tour_date.includes(query);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OPEN" && city.is_active) ||
      (statusFilter === "CLOSED" && !city.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell
      title="Tour Stops & Cities"
      subtitle="Manage tour itinerary, venue addresses, VIP capacities, and registration availability."
    >
      <div className="space-y-6">
        {/* Super Admin Privileged Access Banner */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-[#1A180E] via-[#241F0C] to-[#1A180E] border border-[#D4AF37]/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F8F8FC] flex items-center gap-2">
                  Super Admin Full Access
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50">
                    SUPER_ADMIN
                  </span>
                </h4>
                <p className="text-xs text-[#9E9EAF]">
                  You have full privileges to add, edit, toggle availability, and permanently delete any tour stop nationwide.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#16161D] border border-[#2A2A38] text-[#D4AF37]">
                {cities.length} Tour Cities
              </span>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        {/* Top Control Bar & Filter */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#16161D] p-4 rounded-xl border border-[#2A2A38]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B7E]" />
              <input
                type="text"
                placeholder="Search city, venue, state, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F8F8FC] placeholder-[#6B6B7E] focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-[#0E0E12] p-1 rounded-lg border border-[#2A2A38]">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[#2A2A38] text-white"
                    : "text-[#9E9EAF] hover:text-white"
                }`}
              >
                All ({cities.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("OPEN")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "OPEN"
                    ? "bg-[#10B981]/20 text-[#10B981]"
                    : "text-[#9E9EAF] hover:text-[#10B981]"
                }`}
              >
                Open ({cities.filter((c) => c.is_active).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("CLOSED")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  statusFilter === "CLOSED"
                    ? "bg-[#EF4444]/20 text-[#EF4444]"
                    : "text-[#9E9EAF] hover:text-[#EF4444]"
                }`}
              >
                Closed ({cities.filter((c) => !c.is_active).length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCities}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Tour Stop
            </Button>
          </div>
        </div>

        {/* Cities Grid */}
        {filteredCities.length === 0 ? (
          <div className="p-12 text-center bg-[#16161D] border border-[#2A2A38] rounded-xl">
            <MapPin className="h-10 w-10 text-[#6B6B7E] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Tour Stops Found</h3>
            <p className="text-xs text-[#9E9EAF] mt-1">
              {searchQuery
                ? `No stops matching "${searchQuery}". Clear your search or add a new stop.`
                : "No tour cities currently configured."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCities.map((city) => {
              const dateStr = new Date(`${city.tour_date}T12:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const capPercent = Math.min(
                100,
                Math.round((city.current_registrations_count / (city.max_capacity || 50)) * 100)
              );

              return (
                <Card
                  key={city.id}
                  className={`relative overflow-hidden transition-all ${
                    city.is_active ? "border-[#2A2A38]" : "border-[#2A2A38]/50 opacity-75"
                  }`}
                >
                  {/* Active status indicator pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        city.is_active
                          ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                          : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                      }`}
                    >
                      {city.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Open
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Closed
                        </>
                      )}
                    </span>
                  </div>

                  <CardHeader className="pb-3 pr-24">
                    <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-mono">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {city.state}, {city.country || "USA"}
                      </span>
                    </div>
                    <CardTitle className="text-xl mt-1">
                      {city.name}, {city.state}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2 text-xs text-[#9E9EAF]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                        <span className="font-medium text-white">{dateStr}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <Building className="h-3.5 w-3.5 text-[#9E9EAF] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {city.venue_name || "Venue TBA"}
                          </span>
                          {city.venue_address && (
                            <span className="text-[11px] text-[#6B6B7E] line-clamp-1">
                              {city.venue_address}
                            </span>
                          )}
                        </div>
                      </div>

                      {city.notes && (
                        <p className="text-[11px] text-[#D4AF37]/80 bg-[#16161D] p-2 rounded border border-[#2A2A38] line-clamp-2">
                          {city.notes}
                        </p>
                      )}
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-[#1E1E28]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#9E9EAF] flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Registrations
                        </span>
                        <span className="font-mono font-medium text-white">
                          {city.current_registrations_count} / {city.max_capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1F1F28] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            capPercent > 85 ? "bg-[#EF4444]" : "bg-[#D4AF37]"
                          }`}
                          style={{ width: `${capPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1E1E28] gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(city)}
                        className="text-xs text-[#9E9EAF] hover:text-white"
                      >
                        {city.is_active ? "Close Registrations" : "Open Registrations"}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCity(city);
                            setIsEditModalOpen(true);
                          }}
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>

                        {/* Super Admin permanent delete button */}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCityToDelete(city);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-[#EF4444] hover:bg-[#EF4444]/15 hover:text-[#EF4444] border border-transparent hover:border-[#EF4444]/30 px-2"
                            title="Delete City (Super Admin)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add City Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Tour Stop"
        description="Configure a new tour city, venue details, and VIP guest capacity."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City Name"
              placeholder="e.g. Memphis"
              required
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            />
            <Input
              label="State / Region"
              placeholder="e.g. TN"
              required
              value={addForm.state}
              onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tour Date"
              type="date"
              required
              value={addForm.tour_date}
              onChange={(e) => setAddForm({ ...addForm, tour_date: e.target.value })}
            />
            <Input
              label="Max VIP Capacity"
              type="number"
              min="1"
              max="500"
              required
              value={addForm.max_capacity}
              onChange={(e) => setAddForm({ ...addForm, max_capacity: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Venue Name"
            placeholder="e.g. Orpheum Theatre"
            value={addForm.venue_name}
            onChange={(e) => setAddForm({ ...addForm, venue_name: e.target.value })}
          />

          <Input
            label="Venue Street Address"
            placeholder="e.g. 203 S Main St, Memphis, TN 38103"
            value={addForm.venue_address}
            onChange={(e) => setAddForm({ ...addForm, venue_address: e.target.value })}
          />

          <Input
            label="Internal Notes / VIP Door Instructions"
            placeholder="e.g. Check in at Stage Door B on Main St."
            value={addForm.notes}
            onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="add_city_is_active"
              checked={addForm.is_active}
              onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <label htmlFor="add_city_is_active" className="text-xs text-[#F8F8FC]">
              Make available for fan registration immediately
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Save Tour Stop"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit City Modal */}
      {editingCity && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Tour Stop — ${editingCity.name}, ${editingCity.state}`}
          description="Update venue logistics, VIP capacity, and registration status."
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City Name"
                required
                value={editingCity.name}
                onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })}
              />
              <Input
                label="State / Region"
                required
                value={editingCity.state}
                onChange={(e) => setEditingCity({ ...editingCity, state: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tour Date"
                type="date"
                required
                value={editingCity.tour_date}
                onChange={(e) => setEditingCity({ ...editingCity, tour_date: e.target.value })}
              />
              <Input
                label="Max VIP Capacity"
                type="number"
                min="1"
                max="500"
                required
                value={editingCity.max_capacity}
                onChange={(e) =>
                  setEditingCity({ ...editingCity, max_capacity: Number(e.target.value) })
                }
              />
            </div>

            <Input
              label="Venue Name"
              value={editingCity.venue_name || ""}
              onChange={(e) => setEditingCity({ ...editingCity, venue_name: e.target.value })}
            />

            <Input
              label="Venue Street Address"
              value={editingCity.venue_address || ""}
              onChange={(e) => setEditingCity({ ...editingCity, venue_address: e.target.value })}
            />

            <Input
              label="Internal Notes"
              value={editingCity.notes || ""}
              onChange={(e) => setEditingCity({ ...editingCity, notes: e.target.value })}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="edit_city_is_active"
                checked={editingCity.is_active}
                onChange={(e) =>
                  setEditingCity({ ...editingCity, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#2A2A38] bg-[#0E0E12] text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <label htmlFor="edit_city_is_active" className="text-xs text-[#F8F8FC]">
                Open for fan registrations
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {cityToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCityToDelete(null);
          }}
          title={`Delete Tour Stop — ${cityToDelete.name}, ${cityToDelete.state}`}
          description="Super Admin confirmation: permanently delete this tour city."
        >
          <div className="space-y-4">
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3.5 text-xs text-[#EF4444] flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">Permanent Stop Removal</p>
                <p className="text-[#EF4444]">
                  Are you sure you want to permanently remove <strong>{cityToDelete.name}, {cityToDelete.state}</strong> (tour date: {cityToDelete.tour_date})?
                </p>
                <p className="text-[#9E9EAF] text-[11px] pt-1">
                  Any fan registrations linked to this stop will automatically convert to <strong>Nationwide VIP All-Access</strong> passes so fan data and tracking remain fully intact.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#16161D] border border-[#2A2A38] rounded-lg text-xs space-y-1 font-mono text-[#D4AF37]">
              <div>Venue: <span className="text-white">{cityToDelete.venue_name || "TBA"}</span></div>
              <div>Address: <span className="text-white">{cityToDelete.venue_address || "TBA"}</span></div>
              <div>Registrations: <span className="text-white">{cityToDelete.current_registrations_count}</span> / {cityToDelete.max_capacity}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E1E28]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCityToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white border-0 font-medium"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Tour Stop"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
