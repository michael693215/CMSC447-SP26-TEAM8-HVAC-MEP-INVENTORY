import { IconType } from "react-icons";
interface IconStar {
  icon: IconType;
  className?: string;
}
const IconComponent = ({ icon: Icon, className }: IconStar) => {
  return <Icon className={ className } />;
};
export default IconComponent;