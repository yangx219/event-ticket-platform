import NavBar from "@/components/nav-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateEventRequest,
  CreateTicketTypeRequest,
  EventDetails,
  EventStatusEnum,
  UpdateEventRequest,
  UpdateTicketTypeRequest,
} from "@/domain/domain";
import { createEvent, generateEventCopy, getEvent, updateEvent } from "@/lib/api";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  Edit,
  Plus,
  Loader2,
  Sparkles,
  Ticket,
  Trash,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router";

interface DateTimeSelectProperties {
  date: Date | undefined;
  setDate: (date: Date) => void;
  time: string | undefined;
  setTime: (time: string) => void;
  enabled: boolean;
}

const DateTimeSelect: React.FC<DateTimeSelectProperties> = ({
  date,
  setDate,
  time,
  setTime,
  enabled,
}) => {
  if (!enabled) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
          {/* Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="justify-start border-gray-700 bg-gray-950 text-white hover:bg-gray-800 hover:text-white">
                <CalendarIcon />
                {date ? format(date, "PPP") : <span>Pick a Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  if (!selectedDate) {
                    return;
                  }
                  const displayedYear = selectedDate.getFullYear();
                  const displayedMonth = selectedDate.getMonth();
                  const displayedDay = selectedDate.getDate();

                  const correctedDate = new Date(
                    Date.UTC(displayedYear, displayedMonth, displayedDay),
                  );

                  setDate(correctedDate);
                }}
                className="rounded-md border shadow"
              />
            </PopoverContent>
          </Popover>
          {/* Time */}
          <div className="flex items-center">
            <Input
              type="time"
              className="w-full bg-gray-950 text-white border-gray-700 border [&::-webkit-calendar-picker-indicator]:invert sm:w-[120px]"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
    </div>
  );
};

const generateTempId = () => `temp_${crypto.randomUUID()}`;
const isTempId = (id: string | undefined) => id && id.startsWith("temp_");

interface TicketTypeData {
  id: string | undefined;
  name: string;
  price: number;
  totalAvailable?: number;
  description: string;
}

interface EventData {
  id: string | undefined;
  name: string;
  startDate: Date | undefined;
  startTime: string | undefined;
  endDate: Date | undefined;
  endTime: string | undefined;
  venueDetails: string;
  salesStartDate: Date | undefined;
  salesStartTime: string | undefined;
  salesEndDate: Date | undefined;
  salesEndTime: string | undefined;
  ticketTypes: TicketTypeData[];
  status: EventStatusEnum;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

const DashboardManageEventPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<EventData>({
    id: undefined,
    name: "",
    startDate: undefined,
    startTime: undefined,
    endDate: undefined,
    endTime: undefined,
    venueDetails: "",
    salesStartDate: undefined,
    salesStartTime: undefined,
    salesEndDate: undefined,
    salesEndTime: undefined,
    ticketTypes: [],
    status: EventStatusEnum.DRAFT,
    createdAt: undefined,
    updatedAt: undefined,
  });

  const [currentTicketType, setCurrentTicketType] = useState<
    TicketTypeData | undefined
  >();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [eventDateEnabled, setEventDateEnabled] = useState(false);
  const [eventSalesDateEnabled, setEventSalesDateEnabled] = useState(false);

  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiTone, setAiTone] = useState("Professional and welcoming");
  const [aiLanguage, setAiLanguage] = useState("English");
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: keyof EventData, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isEditMode && !isLoading && user?.access_token) {
      const fetchEvent = async () => {
        const event: EventDetails = await getEvent(user.access_token, id);
        setEventData({
          id: event.id,
          name: event.name,
          startDate: event.start,
          startTime: event.start
            ? formatTimeFromDate(new Date(event.start))
            : undefined,
          endDate: event.end,
          endTime: event.end
            ? formatTimeFromDate(new Date(event.end))
            : undefined,
          venueDetails: event.venue,
          salesStartDate: event.salesStart,
          salesStartTime: event.salesStart
            ? formatTimeFromDate(new Date(event.salesStart))
            : undefined,
          salesEndDate: event.salesEnd,
          salesEndTime: event.salesEnd
            ? formatTimeFromDate(new Date(event.salesEnd))
            : undefined,
          status: event.status,
          ticketTypes: event.ticketTypes.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            totalAvailable: ticket.totalAvailable,
          })),
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        });
        setEventDateEnabled(!!(event.start || event.end));
        setEventSalesDateEnabled(!!(event.salesStart || event.salesEnd));
      };
      fetchEvent();
    }
  }, [id, isEditMode, isLoading, user?.access_token]);

  const formatTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const combineDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time
      .split(":")
      .map((num) => Number.parseInt(num, 10));

    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours);
    combinedDateTime.setMinutes(minutes);
    combinedDateTime.setSeconds(0);

    const utcResult = new Date(
      Date.UTC(
        combinedDateTime.getFullYear(),
        combinedDateTime.getMonth(),
        combinedDateTime.getDate(),
        hours,
        minutes,
        0,
        0,
      ),
    );

    return utcResult;
  };

  const handleEventUpdateSubmit = async (accessToken: string, id: string) => {
    const ticketTypes: UpdateTicketTypeRequest[] = eventData.ticketTypes.map(
      (ticketType) => {
        return {
          id: isTempId(ticketType.id) ? undefined : ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          description: ticketType.description,
          totalAvailable: ticketType.totalAvailable,
        };
      },
    );

    const request: UpdateEventRequest = {
      id: id,
      name: eventData.name,
      start:
        eventData.startDate && eventData.startTime
          ? combineDateTime(eventData.startDate, eventData.startTime)
          : undefined,
      end:
        eventData.endDate && eventData.endTime
          ? combineDateTime(eventData.endDate, eventData.endTime)
          : undefined,
      venue: eventData.venueDetails,
      salesStart:
        eventData.salesStartDate && eventData.salesStartTime
          ? combineDateTime(eventData.salesStartDate, eventData.salesStartTime)
          : undefined,
      salesEnd:
        eventData.salesEndDate && eventData.salesEndTime
          ? combineDateTime(eventData.salesEndDate, eventData.salesEndTime)
          : undefined,
      status: eventData.status,
      ticketTypes: ticketTypes,
    };

    try {
      await updateEvent(accessToken, id, request);
      navigate("/dashboard/events");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleEventCreateSubmit = async (accessToken: string) => {
    const ticketTypes: CreateTicketTypeRequest[] = eventData.ticketTypes.map(
      (ticketType) => {
        return {
          name: ticketType.name,
          price: ticketType.price,
          description: ticketType.description,
          totalAvailable: ticketType.totalAvailable,
        };
      },
    );

    const request: CreateEventRequest = {
      name: eventData.name,
      start:
        eventData.startDate && eventData.startTime
          ? combineDateTime(eventData.startDate, eventData.startTime)
          : undefined,
      end:
        eventData.endDate && eventData.endTime
          ? combineDateTime(eventData.endDate, eventData.endTime)
          : undefined,
      venue: eventData.venueDetails,
      salesStart:
        eventData.salesStartDate && eventData.salesStartTime
          ? combineDateTime(eventData.salesStartDate, eventData.salesStartTime)
          : undefined,
      salesEnd:
        eventData.salesEndDate && eventData.salesEndTime
          ? combineDateTime(eventData.salesEndDate, eventData.salesEndTime)
          : undefined,
      status: eventData.status,
      ticketTypes: ticketTypes,
    };

    try {
      await createEvent(accessToken, request);
      navigate("/dashboard/events");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (isLoading || !user || !user.access_token) {
      setError("You must be logged in to save an event");
      return;
    }

    const dateError = validateEventForm();
    if (dateError) {
      setError(dateError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        if (!eventData.id) {
          setError("Event does not have an ID");
          return;
        }
        await handleEventUpdateSubmit(user.access_token, eventData.id);
      } else {
        await handleEventCreateSubmit(user.access_token);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEventForm = (): string | undefined => {
    if (!eventData.name.trim()) return "Event name is required";
    if (!eventData.venueDetails.trim()) return "Venue details are required";
    if (eventData.ticketTypes.length === 0) return "Add at least one ticket type";

    const start = eventData.startDate && eventData.startTime
      ? combineDateTime(eventData.startDate, eventData.startTime) : undefined;
    const end = eventData.endDate && eventData.endTime
      ? combineDateTime(eventData.endDate, eventData.endTime) : undefined;
    const salesStart = eventData.salesStartDate && eventData.salesStartTime
      ? combineDateTime(eventData.salesStartDate, eventData.salesStartTime) : undefined;
    const salesEnd = eventData.salesEndDate && eventData.salesEndTime
      ? combineDateTime(eventData.salesEndDate, eventData.salesEndTime) : undefined;

    if (eventDateEnabled && (!start || !end)) return "Complete both event dates and times";
    if (start && end && start >= end) return "Event start must be before event end";
    if (eventSalesDateEnabled && (!salesStart || !salesEnd)) {
      return "Complete both sales dates and times";
    }
    if (salesStart && salesEnd && salesStart >= salesEnd) {
      return "Sales start must be before sales end";
    }
    if (salesEnd && start && salesEnd > start) {
      return "Ticket sales must end before the event starts";
    }
    if (eventData.status === EventStatusEnum.PUBLISHED
        && (!start || !end || !salesStart || !salesEnd)) {
      return "Published events require event and sales dates";
    }
    return undefined;
  };

  const handleAddTicketType = () => {
    setCurrentTicketType({
      id: undefined,
      name: "",
      price: 0,
      totalAvailable: 0,
      description: "",
    });
    setDialogOpen(true);
  };

  const handleGenerateCopy = async () => {
    if (!user?.access_token) {
      setError("You must be logged in to use the AI assistant");
      return;
    }
    if (!aiBrief.trim()) {
      setError("Describe your event before generating copy");
      return;
    }

    setError(undefined);
    setIsGeneratingCopy(true);
    try {
      const generated = await generateEventCopy(user.access_token, {
        brief: aiBrief.trim(),
        audience: aiAudience.trim(),
        tone: aiTone,
        language: aiLanguage,
      });
      setEventData((previous) => {
        const generatedTicket = {
          id: generateTempId(),
          name: generated.ticketTypeName,
          description: generated.ticketDescription,
          price: 0,
          totalAvailable: 100,
        };
        return {
          ...previous,
          name: generated.eventName,
          venueDetails: generated.venueDescription,
          ticketTypes: previous.ticketTypes.length === 0
            ? [generatedTicket]
            : previous.ticketTypes.map((ticket, index) => index === 0
              ? {
                  ...ticket,
                  name: generated.ticketTypeName,
                  description: generated.ticketDescription,
                }
              : ticket),
        };
      });
      setAiTags(generated.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI copy generation failed");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleSaveTicketType = () => {
    if (!currentTicketType) {
      return;
    }
    if (!currentTicketType.name.trim()) {
      setError("Ticket type name is required");
      return;
    }
    if (!Number.isFinite(currentTicketType.price) || currentTicketType.price < 0) {
      setError("Ticket price must be zero or greater");
      return;
    }
    if (!Number.isInteger(currentTicketType.totalAvailable)
        || (currentTicketType.totalAvailable ?? -1) < 0) {
      setError("Ticket availability must be a whole number of zero or greater");
      return;
    }

    const newTicketTypes = [...eventData.ticketTypes];

    if (currentTicketType.id) {
      const index = newTicketTypes.findIndex(
        (t) => t.id === currentTicketType.id,
      );
      if (index !== -1) {
        newTicketTypes[index] = currentTicketType;
      }
    } else {
      newTicketTypes.push({
        ...currentTicketType,
        id: generateTempId(),
      });
    }

    updateField("ticketTypes", newTicketTypes);
    setDialogOpen(false);
  };

  const handleEditTicketType = (ticketType: TicketTypeData) => {
    setCurrentTicketType(ticketType);
    setDialogOpen(true);
  };

  const handleDeleteTicketType = (id: string | undefined) => {
    if (!id) {
      return;
    }
    updateField(
      "ticketTypes",
      eventData.ticketTypes.filter((t) => t.id !== id),
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Event" : "Create a New Event"}
          </h1>
          {isEditMode ? (
            <>
              {eventData.id && (
                <p className="text-sm text-gray-400">ID: {eventData.id}</p>
              )}
              {eventData.createdAt && (
                <p className="text-sm text-gray-400">
                  Created At: {format(eventData.createdAt, "PPP")}
                </p>
              )}
              {eventData.updatedAt && (
                <p className="text-sm text-gray-400">
                  Updated At: {format(eventData.updatedAt, "PPP")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-gray-400">Set up the essentials, tickets and publishing status.</p>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Card className="border-violet-500/40 bg-gradient-to-br from-violet-950/60 to-gray-950 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-300" />
                AI event copy assistant
              </CardTitle>
              <p className="text-sm text-gray-300">Turn a short brief into an editable first draft.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={aiBrief}
                onChange={(event) => setAiBrief(event.target.value)}
                maxLength={1200}
                placeholder="Example: An evening Java and AI meetup in Paris with live demos and networking"
                className="min-h-24 border-violet-500/30 bg-black/40"
              />
              <Input
                value={aiAudience}
                onChange={(event) => setAiAudience(event.target.value)}
                maxLength={200}
                placeholder="Audience, e.g. junior developers and tech founders"
                className="border-violet-500/30 bg-black/40"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={aiTone} onChange={(event) => setAiTone(event.target.value)} maxLength={50} aria-label="Writing tone" className="border-violet-500/30 bg-black/40" />
                <Input value={aiLanguage} onChange={(event) => setAiLanguage(event.target.value)} maxLength={50} aria-label="Output language" className="border-violet-500/30 bg-black/40" />
              </div>
              {aiTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiTags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
              )}
              <Button type="button" onClick={handleGenerateCopy} disabled={isGeneratingCopy || !aiBrief.trim()} className="bg-violet-600 hover:bg-violet-500">
                {isGeneratingCopy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isGeneratingCopy ? "Generating…" : "Generate and fill form"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-950 text-white">
            <CardHeader>
              <CardTitle>Event details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event name</Label>
              <Input
                id="event-name"
                className="bg-black border-gray-700 text-white"
                placeholder="e.g. Paris Java Night"
                value={eventData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-details">Venue</Label>
            <Textarea
              id="venue-details"
              placeholder="Venue name, city and useful access details"
              className="min-h-[96px] bg-black border-gray-700"
              value={eventData.venueDetails}
              onChange={(e) => updateField("venueDetails", e.target.value)}
            />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-950 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event schedule</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{eventDateEnabled ? "Enabled" : "Add later"}</span>
                <Switch checked={eventDateEnabled} onCheckedChange={setEventDateEnabled} />
              </div>
            </CardHeader>
            {eventDateEnabled && (
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2"><Label>Starts</Label><DateTimeSelect date={eventData.startDate} setDate={(date) => updateField("startDate", date)} time={eventData.startTime} setTime={(time) => updateField("startTime", time)} enabled /></div>
                <div className="space-y-2"><Label>Ends</Label><DateTimeSelect date={eventData.endDate} setDate={(date) => updateField("endDate", date)} time={eventData.endTime} setTime={(time) => updateField("endTime", time)} enabled /></div>
              </CardContent>
            )}
          </Card>

          <Card className="border-gray-800 bg-gray-950 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales window</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{eventSalesDateEnabled ? "Enabled" : "Add later"}</span>
                <Switch checked={eventSalesDateEnabled} onCheckedChange={setEventSalesDateEnabled} />
              </div>
            </CardHeader>
            {eventSalesDateEnabled && (
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2"><Label>Sales start</Label><DateTimeSelect date={eventData.salesStartDate} setDate={(date) => updateField("salesStartDate", date)} time={eventData.salesStartTime} setTime={(time) => updateField("salesStartTime", time)} enabled /></div>
                <div className="space-y-2"><Label>Sales end</Label><DateTimeSelect date={eventData.salesEndDate} setDate={(date) => updateField("salesEndDate", date)} time={eventData.salesEndTime} setTime={(time) => updateField("salesEndTime", time)} enabled /></div>
              </CardContent>
            )}
          </Card>

          {/* Ticket Types */}
          <div>
            <Card className="bg-gray-950 border-gray-800 text-white">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex gap-2 items-center">
                      <Ticket className="h-5 w-5" />
                      Ticket Types
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => handleAddTicketType()}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Plus /> Add Ticket Type
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {eventData.ticketTypes.length === 0 && (
                    <p className="rounded-lg border border-dashed border-gray-700 px-4 py-6 text-center text-sm text-gray-400">
                      No ticket types yet.
                    </p>
                  )}
                  {eventData.ticketTypes.map((ticketType) => {
                    return (
                      <div key={ticketType.id} className="w-full rounded-lg border border-gray-700 bg-gray-900 p-4">
                        <div className="flex justify-between items-center">
                          {/* Left */}
                          <div>
                            <div className="flex gap-4">
                              <p className="text-small font-medium">
                                {ticketType.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="border-gray-600 text-white font-normal text-xs"
                              >
                                ${ticketType.price}
                              </Badge>
                            </div>
                            {ticketType.totalAvailable && (
                              <p className="text-gray-400">
                                {ticketType.totalAvailable} tickets available
                              </p>
                            )}
                          </div>
                          {/* Right */}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleEditTicketType(ticketType)}
                            >
                              <Edit />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-400"
                              onClick={() =>
                                handleDeleteTicketType(ticketType.id)
                              }
                            >
                              <Trash />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Add Ticket Type</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Please enter details of the ticket type
                    </DialogDescription>
                  </DialogHeader>

                  {/* Ticket Type Name */}
                  <div className="space-y-1">
                    <Label htmlFor="ticket-type-name">Name</Label>
                    <Input
                      id="ticket-type-name"
                      className="bg-gray-800 border-gray-700"
                      value={currentTicketType?.name}
                      onChange={(e) =>
                        setCurrentTicketType(
                          currentTicketType
                            ? { ...currentTicketType, name: e.target.value }
                            : undefined,
                        )
                      }
                      placeholder="e.g General Admission, VIP, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    {/* Price */}
                    <div className="space-y-1 w-full">
                      <Label htmlFor="ticket-type-price">Price</Label>
                      <Input
                        id="ticket-type-price"
                        type="number"
                        value={currentTicketType?.price}
                        onChange={(e) =>
                          setCurrentTicketType(
                            currentTicketType
                              ? {
                                  ...currentTicketType,
                                  price: Number.parseFloat(e.target.value),
                                }
                              : undefined,
                          )
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    {/* Total Available */}
                    <div className="space-y-1 w-full">
                      <Label htmlFor="ticket-type-total-available">
                        Total Available
                      </Label>
                      <Input
                        id="ticket-type-total-available"
                        type="number"
                        value={currentTicketType?.totalAvailable}
                        onChange={(e) =>
                          setCurrentTicketType(
                            currentTicketType
                              ? {
                                  ...currentTicketType,
                                  totalAvailable: Number.parseFloat(
                                    e.target.value,
                                  ),
                                }
                              : undefined,
                          )
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  {/* Ticket Type Description */}
                  <div className="space-y-1">
                    <Label htmlFor="ticket-type-description">Description</Label>
                    <Textarea
                      id="ticket-type-description"
                      className="bg-gray-800 border-gray-700"
                      value={currentTicketType?.description}
                      onChange={(e) =>
                        setCurrentTicketType(
                          currentTicketType
                            ? {
                                ...currentTicketType,
                                description: e.target.value,
                              }
                            : undefined,
                        )
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      className="bg-white text-black hover:bg-gray-300"
                      onClick={handleSaveTicketType}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-gray-900 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-950 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={eventData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger className="w-[180px] bg-black border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value={EventStatusEnum.DRAFT}>Draft</SelectItem>
                  <SelectItem value={EventStatusEnum.PUBLISHED}>Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="min-w-32 bg-violet-600 hover:bg-violet-500">
              {isSubmitting ? "Saving..." : isEditMode ? "Update event" : "Create event"}
            </Button>
          </div>
        </form>
        {/* For Development Only */}
        {/* <p className="mt-8 font-mono text-white">{JSON.stringify(eventData)}</p> */}
      </div>
    </div>
  );
};

export default DashboardManageEventPage;
