import { PublishedEventSummary } from "@/domain/domain";
import { Card } from "./ui/card";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router";
import RandomEventImage from "./random-event-image";

interface PublishedEventCardProperties {
  publishedEvent: PublishedEventSummary;
}

const PublishedEventCard: React.FC<PublishedEventCardProperties> = ({
  publishedEvent,
}) => {
  return (
    <Link className="group block h-full" to={`/events/${publishedEvent.id}`}>
      <Card className="h-full overflow-hidden border-gray-800 bg-gray-950 py-0 text-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-950/40">
        {/* Card Image */}
        <div className="relative h-48 overflow-hidden">
          <RandomEventImage seed={publishedEvent.id} alt={publishedEvent.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-violet-500/90 px-3 py-1 text-xs font-semibold">
            Tickets available
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-4 text-xl font-semibold leading-tight group-hover:text-violet-300">
            {publishedEvent.name}
          </h3>
          <div className="flex gap-2 text-sm mb-3 text-gray-400">
            <MapPin className="h-5 w-5 shrink-0 text-violet-400" /> {publishedEvent.venue}
          </div>
          <div className="flex gap-2 text-sm text-gray-400">
            {publishedEvent.start && publishedEvent.end ? (
              <div className="flex gap-2">
                <Calendar className="h-5 w-5 shrink-0 text-violet-400" />{" "}
                {format(publishedEvent.start, "PP")} -{" "}
                {format(publishedEvent.end, "PP")}
              </div>
            ) : (
              <div className="flex gap-2">
                <Calendar />
                Dates TBD
              </div>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4 font-semibold text-violet-300">
            <span>View tickets</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PublishedEventCard;
