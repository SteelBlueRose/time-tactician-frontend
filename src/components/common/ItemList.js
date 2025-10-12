import React, { useState } from "react";
import itemStyles from "@/app/styles/components/layout/ItemLayout.module.css";

export const ItemList = ({
  items,
  selectedId,
  onSelect,
  renderBadges,
  renderPrefix,
  renderContent,
  getSubItems,
  nestedItemClassName,
  containerClassName,
  itemClassName,
  subItemsContainerClassName,
}) => {
  const [expandedItems, setExpandedItems] = useState([]);

  const toggleExpanded = (itemId, e) => {
    e?.stopPropagation();
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const ItemRow = ({ item, isSubItem = false, isLastSubItem = false }) => {
    const subItems = getSubItems?.(item);
    const hasSubItems = subItems?.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <div className={containerClassName}>
        <div
          className={`${itemClassName} ${
            isSubItem ? nestedItemClassName : ""
          } ${isLastSubItem ? itemStyles.lastSubItem : ""}`}
        >
          <div
            className={`${itemStyles.itemBlock} 
              ${selectedId === item.id ? itemStyles.selected : ""}`}
          >
            {renderPrefix?.(item, hasSubItems, isExpanded, toggleExpanded)}

            <div
              className={itemStyles.itemContent}
              onClick={() => onSelect(item)}
            >
              {renderContent(item)}
              <div className={itemStyles.badgesContainer}>
                {renderBadges?.(item)}
              </div>
            </div>
          </div>
        </div>

        {hasSubItems && isExpanded && (
          <div className={subItemsContainerClassName}>
            {subItems
              .map((subItem, index, filteredArray) => (
                <ItemRow
                  key={subItem.id}
                  item={subItem}
                  isSubItem={true}
                  isLastSubItem={index === filteredArray.length - 1}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  const allSubItemIds = new Set();
  items.forEach((item) => {
    if (item.subtask_ids) {
      item.subtask_ids.forEach((id) => allSubItemIds.add(id));
    }
  });

  const rootItems = items.filter(
    (item) =>
      !items.some((parentItem) => parentItem.subtask_ids?.includes(item.id))
  );

  return (
    <div className={itemStyles.itemsList}>
      {rootItems.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ItemList;
