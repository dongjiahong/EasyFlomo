
import React, { useMemo } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import { Tooltip } from 'react-tooltip';

interface HeatmapProps {
  activityData: Map<string, number>;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
}

const Heatmap: React.FC<HeatmapProps> = ({ activityData, selectedDate, onDateClick }) => {
  
  const data: Activity[] = useMemo(() => {
    // Generate data for the last 2 months to fit sidebar perfectly without scrolling
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 2); 

    const dates: Activity[] = [];
    
    // Iterate from start date to today
    for (let d = startDate; d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = activityData.get(dateStr) || 0;
      
      // Level logic (0-4)
      let level = 0;
      if (count > 0) level = 1;
      if (count > 2) level = 2;
      if (count > 5) level = 3;
      if (count > 10) level = 4;

      dates.push({
        date: dateStr,
        count: count,
        level: level
      });
    }

    return dates;
  }, [activityData]);

  return (
    <div className="w-full mb-6 px-4 flex justify-center">
      <ActivityCalendar
        data={data}
        theme={{
          // Darkened level 0 (empty) from #e5e7eb to #d1d5db (zinc-300) for better visibility against gray backgrounds
          light: ['#d1d5db', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
          dark: ['#d1d5db', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
        }}
        colorScheme="light"
        blockSize={14}
        blockMargin={3}
        blockRadius={3}
        fontSize={12}
        hideColorLegend
        hideTotalCount
        hideMonthLabels={false}
        renderBlock={(block, activity) => (
          React.cloneElement(block, {
            'data-tooltip-id': 'react-tooltip',
            'data-tooltip-content': `${activity.date}: ${activity.count} 笔记`,
            style: { 
              ...block.props.style, 
              cursor: 'pointer',
              // Make the selected state pop more
              outline: selectedDate === activity.date ? '2px solid #333' : 'none',
              outlineOffset: '2px',
              borderRadius: '2px'
            },
            onClick: () => onDateClick(activity.date)
          })
        )}
      />
      <Tooltip 
        id="react-tooltip" 
        style={{ 
            backgroundColor: '#333', 
            color: '#fff', 
            fontSize: '12px', 
            padding: '6px 10px',
            borderRadius: '6px',
            zIndex: 50
        }} 
      />
    </div>
  );
};

export default Heatmap;
