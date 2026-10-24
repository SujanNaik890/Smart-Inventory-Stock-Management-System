import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import RobotIllustration from './RobotIllustration';

export const AiBannerCard = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #F0F4FF 0%, #F5F3FF 50%, #FAF5FF 100%)',
        border: '1px solid #E0E7FF',
        borderRadius: '18px',
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(64, 91, 255, 0.06)'
      }}
    >
      <div style={{ maxWidth: '65%', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} color="#405BFF" strokeWidth={2.4} />
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#101A46' }}>
            AI Inventory Assistant
          </h4>
        </div>

        <p style={{ fontSize: '12px', color: '#576282', lineHeight: '1.45', marginBottom: '14px' }}>
          Get smart insights, restock suggestions and inventory analysis using AI.
        </p>

        <button
          onClick={() => navigate('/ai-assistant')}
          className="btn-primary"
          style={{
            padding: '8px 18px',
            fontSize: '12.5px',
            fontWeight: '700',
            borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(64, 91, 255, 0.3)'
          }}
        >
          Ask AI Assistant &rarr;
        </button>
      </div>

      {/* Robot on right */}
      <div style={{ flexShrink: 0, transform: 'scale(1.05)' }}>
        <RobotIllustration size={92} />
      </div>
    </div>
  );
};

export default AiBannerCard;
