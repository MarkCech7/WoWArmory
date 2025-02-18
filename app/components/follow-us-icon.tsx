export function FollowUsIcon(props: { url: string; src: string; alt: string }) {
  return (
    <div>
      <a href={props.url} target="_blank">
        <img className="w-[32px] h-[32px]" src={props.src} alt={props.alt} />
      </a>
    </div>
  );
}
