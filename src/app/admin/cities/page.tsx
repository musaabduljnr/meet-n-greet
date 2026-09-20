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
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  getAdminCitiesAction,
  createCityAction,
  updateCityAction,
  toggleCityActiveAction,
} from "@/app/actions/admin";
import type { City } from "@/types/database";

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    state: "",
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
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await createCityAction({
      name: addForm.name,
      state: addForm.state,
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

  return (
    <AdminShell
      title="Tour Stops & Cities"
      subtitle="Manage tour itinerary, venue addresses, VIP capacities, and registration availability."
    >
      <div className="space-y-6">
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

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9E9EAF]">
              Active Itinerary: <strong className="text-white">{cities.length}</strong> tour cities
            </span>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities.map((city) => {
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
                      {city.state}, {city.country}
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
    </AdminShell>
  );
}
