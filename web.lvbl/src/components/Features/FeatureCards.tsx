import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Droplets, Vote, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FeatureCards = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: TrendingUp,
      titleKey: "features.betOnEvents.title",
      descriptionKey: "features.betOnEvents.description",
      link: "/markets",
      wikiSection: "/wiki#bet-on-events",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      icon: Droplets,
      titleKey: "features.provideLiquidity.title",
      descriptionKey: "features.provideLiquidity.description",
      link: "/markets",
      wikiSection: "/wiki#provide-liquidity",
      gradient: "from-primary/15 to-primary/5",
    },
    {
      icon: Vote,
      titleKey: "features.governance.title",
      descriptionKey: "features.governance.description",
      link: "/governance",
      wikiSection: "/wiki#governance",
      gradient: "from-primary/10 to-primary/5",
    },
    {
      icon: Coins,
      titleKey: "features.stakePrsm.title",
      descriptionKey: "features.stakePrsm.description",
      link: "/portfolio",
      wikiSection: "/wiki#stake-prsm",
      gradient: "from-primary-glow/20 to-primary-glow/5",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-background to-background/80">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <Card
                className={`h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${feature.gradient} border-border/40`}
              >
                <CardContent className="p-6 flex flex-col items-start h-full">
                  <Link to={feature.wikiSection} className="flex flex-col flex-1 w-full">
                    <div className="mb-4 p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t(feature.descriptionKey)}</p>
                  </Link>
                  <Link to={feature.wikiSection} className="text-sm text-primary hover:underline font-medium mt-auto">
                    {t('features.learnMore')}
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
