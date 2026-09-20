"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Ticket,
  Mail,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner, Skeleton } from "@/components/ui/LoadingState";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Timeline, TimelineStep } from "@/components/ui/Timeline";

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Sample timeline steps for demonstration
  const sampleSteps: TimelineStep[] = [
    {
      id: "1",
      title: "Registered",
      description: "VIP registration submitted & verified.",
      date: "Sep 20, 10:30 AM",
      state: "completed",
    },
    {
      id: "2",
      title: "Processing",
      description: "Fan Card queued for custom metallic embossing.",
      date: "Sep 20, 12:15 PM",
      state: "completed",
    },
    {
      id: "3",
      title: "Prepared",
      description: "VIP credentials packaged in security sleeve.",
      date: "Sep 20, 03:45 PM",
      state: "current",
    },
    {
      id: "4",
      title: "Shipped",
      description: "Handed over to direct tour courier.",
      state: "upcoming",
    },
    {
      id: "5",
      title: "Delivered",
      description: "Physical VIP package delivered to fan.",
      state: "upcoming",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F8F8FC]">
      <PublicHeader />

      <main className="flex-1 py-12">
        <Container size="xl">
          {/* Header */}
          <div className="mb-12 border-b border-[#2A2A38] pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">
                  Design System & Shell Foundation
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-[#F8F8FC] mt-1">
                  Kountry Wayne VIP Component System
                </h1>
                <p className="text-sm text-[#9E9EAF] mt-2 max-w-2xl">
                  A high-contrast, accessible, editorial design language engineered for celebrity VIP experiences, Fan Card fulfillment, and tour operations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    View Admin Shell
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" size="sm">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-16">
            {/* 1. Typography & Colors */}
            <section aria-labelledby="section-colors">
              <h2 id="section-colors" className="text-xl font-semibold text-[#F8F8FC] mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
                <span>1. Core Color Tokens & Contrast</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-lg bg-[#09090B] border border-[#2A2A38] flex flex-col justify-between h-28">
                  <span className="text-xs text-[#9E9EAF]">Base Onyx</span>
                  <span className="text-xs font-mono text-white">#09090B</span>
                </div>
                <div className="p-4 rounded-lg bg-[#111115] border border-[#2A2A38] flex flex-col justify-between h-28">
                  <span className="text-xs text-[#9E9EAF]">Surface</span>
                  <span className="text-xs font-mono text-white">#111115</span>
                </div>
                <div className="p-4 rounded-lg bg-[#181820] border border-[#2A2A38] flex flex-col justify-between h-28">
                  <span className="text-xs text-[#9E9EAF]">Elevated</span>
                  <span className="text-xs font-mono text-white">#181820</span>
                </div>
                <div className="p-4 rounded-lg bg-[#D4AF37] text-black flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">VIP Gold</span>
                  <span className="text-xs font-mono font-bold">#D4AF37</span>
                </div>
                <div className="p-4 rounded-lg bg-[#F4E8C1] text-black flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Champagne</span>
                  <span className="text-xs font-mono font-bold">#F4E8C1</span>
                </div>
                <div className="p-4 rounded-lg bg-[#10B981] text-black flex flex-col justify-between h-28">
                  <span className="text-xs font-semibold">Emerald Status</span>
                  <span className="text-xs font-mono font-bold">#10B981</span>
                </div>
              </div>
            </section>

            {/* 2. Buttons */}
            <section aria-labelledby="section-buttons">
              <h2 id="section-buttons" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                2. Buttons & States
              </h2>

              <div className="p-6 bg-[#111115] border border-[#2A2A38] rounded-xl flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="md">
                    Primary VIP Gold
                  </Button>
                  <Button variant="secondary" size="md">
                    Secondary Surface
                  </Button>
                  <Button variant="outline" size="md">
                    Outline Border
                  </Button>
                  <Button variant="ghost" size="md">
                    Ghost Link
                  </Button>
                  <Button variant="danger" size="md">
                    Danger Action
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#1E1E28] pt-4">
                  <Button variant="primary" size="sm" leftIcon={<Ticket className="h-3.5 w-3.5" />}>
                    Small with Icon
                  </Button>
                  <Button variant="primary" size="md" leftIcon={<Mail className="h-4 w-4" />}>
                    Medium with Icon
                  </Button>
                  <Button variant="primary" size="lg" rightIcon={<Calendar className="h-5 w-5" />}>
                    Large with Icon
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    isLoading={buttonLoading}
                    onClick={() => {
                      setButtonLoading(true);
                      setTimeout(() => setButtonLoading(false), 1500);
                    }}
                  >
                    Click for Loading State
                  </Button>
                  <Button variant="primary" size="md" disabled>
                    Disabled State
                  </Button>
                </div>
              </div>
            </section>

            {/* 3. Form Components */}
            <section aria-labelledby="section-forms">
              <h2 id="section-forms" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                3. Form Controls & Validation States
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#111115] border border-[#2A2A38] rounded-xl">
                <Input
                  label="Fan Full Legal Name"
                  placeholder="e.g. Marcus Sterling"
                  required
                  helperText="Must match government-issued photo ID for venue check-in."
                />

                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="marcus@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />

                <Input
                  label="Tracking Code"
                  placeholder="KW-XXXX-XXXX"
                  defaultValue="INVALID-CODE"
                  error="Invalid code format. Tracking codes must begin with KW- followed by 8 characters."
                />

                <Select
                  label="Tour City Selection"
                  placeholder="Select your tour stop..."
                  required
                  options={[
                    { value: "atl", label: "Atlanta, GA — Fox Theatre (Nov 14, 2026)" },
                    { value: "hou", label: "Houston, TX — Bayou Music Center (Nov 20, 2026)" },
                    { value: "chi", label: "Chicago, IL — Chicago Theatre (Dec 05, 2026)" },
                    { value: "la", label: "Los Angeles, CA — The Wiltern (Dec 12, 2026)" },
                  ]}
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="VIP Fan Card Shipping Address"
                    placeholder="Street address, suite/apt, city, state, and postal code"
                    required
                    helperText="Your commemorative physical VIP Fan Card will be shipped to this location."
                  />
                </div>
              </div>
            </section>

            {/* 4. Badges & Status Indicators */}
            <section aria-labelledby="section-status">
              <h2 id="section-status" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                4. Badges & Lifecycle Status Indicators
              </h2>

              <div className="p-6 bg-[#111115] border border-[#2A2A38] rounded-xl flex flex-col gap-6">
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#9E9EAF] mb-3">
                    Generic Editorial Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">VIP Gold</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success" dot>Confirmed</Badge>
                    <Badge variant="warning" dot>Pending Review</Badge>
                    <Badge variant="info" dot>Dispatched</Badge>
                    <Badge variant="error" dot>Action Required</Badge>
                    <Badge variant="neutral">Read Only</Badge>
                  </div>
                </div>

                <div className="border-t border-[#1E1E28] pt-4">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#9E9EAF] mb-3">
                    Fan Attendance Lifecycle
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <StatusIndicator type="registration" status="REGISTERED" />
                    <StatusIndicator type="registration" status="SCHEDULE_PENDING" />
                    <StatusIndicator type="registration" status="SCHEDULED" />
                    <StatusIndicator type="registration" status="COMPLETED" />
                    <StatusIndicator type="registration" status="CANCELLED" />
                  </div>
                </div>

                <div className="border-t border-[#1E1E28] pt-4">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-[#9E9EAF] mb-3">
                    Fan Card Physical Fulfillment Lifecycle (Admin-Controlled)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <StatusIndicator type="fan_card" status="REGISTERED" />
                    <StatusIndicator type="fan_card" status="PROCESSING" />
                    <StatusIndicator type="fan_card" status="PREPARED" />
                    <StatusIndicator type="fan_card" status="SHIPPED" />
                    <StatusIndicator type="fan_card" status="IN_TRANSIT" />
                    <StatusIndicator type="fan_card" status="OUT_FOR_DELIVERY" />
                    <StatusIndicator type="fan_card" status="DELIVERED" />
                    <StatusIndicator type="fan_card" status="DELIVERY_ISSUE" />
                    <StatusIndicator type="fan_card" status="CANCELLED" />
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Alerts */}
            <section aria-labelledby="section-alerts">
              <h2 id="section-alerts" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                5. Accessible Alerts
              </h2>

              <div className="flex flex-col gap-3">
                {!alertDismissed && (
                  <Alert
                    variant="info"
                    title="VIP Scheduling In Progress"
                    onDismiss={() => setAlertDismissed(true)}
                  >
                    Your registration has been received. Arrival times and private venue coordinates will be dispatched via email 72 hours prior to the show date.
                  </Alert>
                )}

                <Alert
                  variant="success"
                  title="Tracking Code Verified"
                >
                  Tracking code KW-8K2M-9P4X is active. Physical Fan Card has been prepared and queued for delivery.
                </Alert>

                <Alert
                  variant="warning"
                  title="Venue Capacity Nearing Threshold"
                >
                  Fox Theatre (Atlanta) is currently at 94% VIP cohort capacity.
                </Alert>

                <Alert
                  variant="error"
                  title="Courier Address Delivery Issue"
                >
                  Fulfillment team reported a postal carrier address exception. Please confirm apartment number.
                </Alert>
              </div>
            </section>

            {/* 6. Milestone Timeline Stepper */}
            <section aria-labelledby="section-timeline">
              <h2 id="section-timeline" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                6. Milestone Timeline Steppers
              </h2>

              <Card>
                <CardHeader>
                  <CardTitle>Fan Card Live Fulfillment Tracker</CardTitle>
                  <CardDescription>
                    Public milestone stepper rendered directly from private cryptographic tracking lookup.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Timeline steps={sampleSteps} orientation="horizontal" />
                </CardContent>
              </Card>
            </section>

            {/* 7. Responsive Tables */}
            <section aria-labelledby="section-tables">
              <h2 id="section-tables" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                7. Responsive Tables & Empty States
              </h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fan</TableHead>
                    <TableHead>Tour City</TableHead>
                    <TableHead>Tracking Code</TableHead>
                    <TableHead>Attendance Status</TableHead>
                    <TableHead>Fan Card Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Marcus S. (Verified)</TableCell>
                    <TableCell>Atlanta, GA</TableCell>
                    <TableCell className="font-mono text-[#D4AF37]">KW-7X9K-42M1</TableCell>
                    <TableCell>
                      <StatusIndicator type="registration" status="SCHEDULED" />
                    </TableCell>
                    <TableCell>
                      <StatusIndicator type="fan_card" status="PREPARED" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Keisha T.</TableCell>
                    <TableCell>Houston, TX</TableCell>
                    <TableCell className="font-mono text-[#D4AF37]">KW-3V8P-91L4</TableCell>
                    <TableCell>
                      <StatusIndicator type="registration" status="SCHEDULE_PENDING" />
                    </TableCell>
                    <TableCell>
                      <StatusIndicator type="fan_card" status="PROCESSING" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">David R.</TableCell>
                    <TableCell>Chicago, IL</TableCell>
                    <TableCell className="font-mono text-[#D4AF37]">KW-9N2X-55Q8</TableCell>
                    <TableCell>
                      <StatusIndicator type="registration" status="REGISTERED" />
                    </TableCell>
                    <TableCell>
                      <StatusIndicator type="fan_card" status="REGISTERED" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            {/* 8. Interactive Modal & Loading Skeletons */}
            <section aria-labelledby="section-modals">
              <h2 id="section-modals" className="text-xl font-semibold text-[#F8F8FC] mb-4">
                8. Modals & Skeleton Loading States
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Accessible Modal</CardTitle>
                    <CardDescription>
                      Tested with Escape key, scroll lock, backdrop click, and focus management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                      Open Test VIP Modal
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Loading States & Spinners</CardTitle>
                    <CardDescription>
                      Clean dark mode skeleton placeholders for async content loading.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Spinner size="sm" />
                      <Spinner size="md" />
                      <Spinner size="lg" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>

              {/* Empty state demo */}
              <div className="mt-8">
                <EmptyState
                  title="No Pending Fan Registrations"
                  description="All fan VIP registrations for this tour city have been scheduled and notified."
                  action={
                    <Button variant="secondary" size="sm">
                      Select Another City
                    </Button>
                  }
                />
              </div>
            </section>
          </div>
        </Container>
      </main>

      <PublicFooter />

      {/* Accessible Modal Instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Assign Meet & Greet Schedule"
        description="Assign a dedicated VIP cohort arrival time and private venue instructions for Marcus S."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Save & Dispatch Email
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Assigned Arrival Date"
            type="date"
            defaultValue="2026-11-14"
            required
          />
          <Input
            label="Mandatory Arrival Time"
            type="time"
            defaultValue="17:30"
            required
          />
          <Input
            label="VIP Venue Name"
            defaultValue="Fox Theatre — VIP Green Room Entrance"
            required
          />
          <Textarea
            label="Confidential Arrival Instructions"
            defaultValue="Enter through Stage Door B on Peachtree St. Security will cross-reference your photo ID against the registered fan list. No oversized bags permitted."
            required
          />
        </div>
      </Modal>
    </div>
  );
}
