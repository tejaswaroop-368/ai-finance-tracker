interface AIInsightsCardProps {
    title: string;
    value: string;
    description: string;
}

const AIInsightsCard = ({ title, value, description }: AIInsightsCardProps) => {
    return (
        <div className="ai-card">
            <div className="ai-card-header">
                <h3>{title}</h3>
                <span>{value}</span>
            </div>
            <p>{description}</p>
        </div>
    );
};

export default AIInsightsCard;
