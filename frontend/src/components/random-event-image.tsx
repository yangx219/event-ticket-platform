interface RandomEventImageProps {
  seed?: string;
  alt?: string;
}

const RandomEventImage: React.FC<RandomEventImageProps> = ({
  seed = "event",
  alt = "Event",
}) => {
  const imageIndex =
    [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % 4 + 1;

  return (
    <img
      src={`/event-image-${imageIndex}.webp`}
      alt={alt}
      className="h-full w-full object-cover"
    />
  );
};

export default RandomEventImage;
