import React, { useState } from "react";

const RoleCard = ({
  id,
  title,
  icon,
  hoverInfo,
  isSelected,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`role-card ${isSelected ? "role-card-selected" : ""}`}
      onClick={() => onClick(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`role-card-icon ${isSelected ? "role-card-icon-selected" : ""}`}>
        {icon}
      </div>
      <h4 className={`role-card-title ${isSelected ? "role-card-title-selected" : ""}`}>
        {title}
      </h4>
      {isHovered && hoverInfo && (
        <div className="role-card-hover">
          <p className="role-card-hover-text">{hoverInfo}</p>
        </div>
      )}
    </div>
  );
};

export default RoleCard;