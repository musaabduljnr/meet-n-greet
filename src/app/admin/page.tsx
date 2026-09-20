"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarClock,
  CreditCard,
  CheckCircle2,
  Search,
  Mail,
  MapPin,
  ArrowRight,
  RefreshCw,
  Plus,
  Building,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Alert } from "@/components/ui/Alert";
import { getDashboardDataAction } from "@/app/actions/admin";
import type { DashboardKPIs, EnrichedRegistration } from "@/lib/services/operations-service";

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<EnrichedRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await getDashboardDataAction();
    if (res.success && res.data) {
      setKpis(res.data.kpis);
      setRecentRegistrations(res.data.recentRegistrations);
    } else {
      setErrorMessage(res.error || "Failed to load dashboard metrics.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminShell
      title="Tour Operations Dashboard"
      subtitle="VIP Cohorts, Meet & Greet Schedules, and Physical Fan Card Logistics"
    >
      <div className="space-y-8">
        {errorMessage && (
          <Alert variant="error" title="Notice">
            {errorMessage}
          </Alert>
        )}

        {/* Top Control */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF]">
            Live Operations Overview
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh Data
          </Button>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/registrations" className="block group">
            <Card className="transition-all hover:border-[#D4AF37]/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF]">
                    Total Registrations
                  </p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {kpis ? kpis.totalRegistrations : "—"}
                  </h3>
                  <p className="text-[11px] text-[#10B981] mt-1 font-medium flex items-center gap-1">
                    Across {kpis?.cityBreakdown.length || 0} Tour Stops{" "}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-[#1F1F28] border border-[#2A2A38] flex items-center justify-center text-[#D4AF37]">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/schedules" className="block group">
            <Card className="transition-all hover:border-[#F59E0B]/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF]">
                    Awaiting Schedule
                  </p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {kpis ? kpis.pendingScheduling : "—"}
                  </h3>
                  <p className="text-[11px] text-[#F59E0B] mt-1 font-medium flex items-center gap-1">
                    Needs Venue Slot{" "}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-[#1F1F28] border border-[#2A2A38] flex items-center justify-center text-[#F59E0B]">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/fan-cards" className="block group">
            <Card className="transition-all hover:border-[#3B82F6]/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF]">
                    Fan Cards Active
                  </p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {kpis ? kpis.fanCardsInTransit : "—"}
                  </h3>
                  <p className="text-[11px] text-[#3B82F6] mt-1 font-medium flex items-center gap-1">
                    Fulfillment Pipeline{" "}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-[#1F1F28] border border-[#2A2A38] flex items-center justify-center text-[#3B82F6]">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/registrations?status=COMPLETED" className="block group">
            <Card className="transition-all hover:border-[#10B981]/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#9E9EAF]">
                    Completed VIPs
                  </p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {kpis ? kpis.completedVIPs : "—"}
                  </h3>
                  <p className="text-[11px] text-[#10B981] mt-1 font-medium flex items-center gap-1">
                    Attended & Delivered{" "}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
                <div className="h-11 w-11 rounded-lg bg-[#1F1F28] border border-[#2A2A38] flex items-center justify-center text-[#10B981]">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/cities"
            className="p-4 rounded-xl bg-[#111115] border border-[#2A2A38] hover:border-[#D4AF37] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Manage Tour Cities</h4>
                <p className="text-xs text-[#9E9EAF]">Venues & registration caps</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#6B6B7E]" />
          </Link>

          <Link
            href="/admin/schedules"
            className="p-4 rounded-xl bg-[#111115] border border-[#2A2A38] hover:border-[#D4AF37] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Assign Call Times</h4>
                <p className="text-xs text-[#9E9EAF]">Secret door instructions</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#6B6B7E]" />
          </Link>

          <Link
            href="/admin/fan-cards"
            className="p-4 rounded-xl bg-[#111115] border border-[#2A2A38] hover:border-[#D4AF37] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Fan Card Pipeline</h4>
                <p className="text-xs text-[#9E9EAF]">Advance batch fulfillment</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#6B6B7E]" />
          </Link>
        </div>

        {/* Tour Stops Capacity Summary */}
        {kpis && kpis.cityBreakdown.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tour Stops Capacity & Availability</CardTitle>
                <CardDescription>
                  Registration fill rates across upcoming Wayne tour cities.
                </CardDescription>
              </div>
              <Link href="/admin/cities">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View All Cities
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.cityBreakdown.map((city) => {
                  const capPercent = Math.min(
                    100,
                    Math.round((city.registrations_count / (city.max_capacity || 50)) * 100)
                  );

                  return (
                    <div
                      key={city.id}
                      className="p-3.5 rounded-lg bg-[#0E0E12] border border-[#1E1E28] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">
                          {city.name}, {city.state}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            city.is_active
                              ? "bg-[#10B981]/15 text-[#10B981]"
                              : "bg-[#EF4444]/15 text-[#EF4444]"
                          }`}
                        >
                          {city.is_active ? "OPEN" : "CLOSED"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#9E9EAF]">
                        <span>Tour Date: {city.tour_date}</span>
                        <span className="font-mono text-white">
                          {city.registrations_count} / {city.max_capacity}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1F1F28] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37] transition-all"
                          style={{ width: `${capPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Registrations Roster */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Recent VIP Registrations</CardTitle>
              <CardDescription>
                Latest attendee submissions awaiting triage and scheduling.
              </CardDescription>
            </div>

            <Link href="/admin/registrations">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View Full Roster
              </Button>
            </Link>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fan Name & Contact</TableHead>
                <TableHead>Tour Stop</TableHead>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Attendance Status</TableHead>
                <TableHead>Fan Card Status</TableHead>
                <TableHead>Call Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#9E9EAF]">
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                recentRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {reg.fan.first_name} {reg.fan.last_name}
                        </span>
                        <span className="text-xs text-[#9E9EAF]">{reg.fan.email}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">
                          {reg.city?.name}, {reg.city?.state}
                        </span>
                        <span className="text-[11px] text-[#6B6B7E]">
                          {reg.city?.tour_date}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-[#D4AF37]">
                        {reg.fanCard?.tracking_code || "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusIndicator type="registration" status={reg.status} />
                    </TableCell>

                    <TableCell>
                      {reg.fanCard ? (
                        <StatusIndicator type="fan_card" status={reg.fanCard.current_status} />
                      ) : (
                        <span className="text-xs text-[#6B6B7E]">Pending</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-mono text-[#9E9EAF]">
                        {reg.schedule?.arrival_time || "Pending"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/admin/schedules`}>
                        <Button variant="outline" size="sm">
                          Schedule
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminShell>
  );
}
